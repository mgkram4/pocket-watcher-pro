'use client';

import { Connection, LAMPORTS_PER_SOL, PublicKey } from '@solana/web3.js';
import { create } from 'zustand';

interface TokenPurchase {
  signature: string;
  timestamp: number;
  tokenSymbol: string;
  amount: number;
}

interface Transaction {
  signature: string;
  timestamp: number;
  type: 'BUY' | 'SELL' | 'TRANSFER' | 'SWAP' | 'OTHER';
  inputToken?: {
    symbol: string;
    amount: number;
    usdValue?: number;
  };
  outputToken?: {
    symbol: string;
    amount: number;
    usdValue?: number;
  };
  programName?: string;
}

interface TokenBalance {
  symbol: string;
  name: string;
  amount: number;
  mint: string;
  value?: number;
}

interface WalletStore {
  balance: number;
  tokenBalances: TokenBalance[];
  recentPurchases: TokenPurchase[];
  transactions: Transaction[];
  isLoading: boolean;
  setBalance: (balance: number) => void;
  setTokenBalances: (balances: TokenBalance[]) => void;
  addPurchases: (purchases: TokenPurchase[]) => void;
  setTransactions: (txs: Transaction[]) => void;
  setLoading: (loading: boolean) => void;
}

export const useWalletStore = create<WalletStore>((set) => ({
  balance: 0,
  tokenBalances: [],
  recentPurchases: [],
  transactions: [],
  isLoading: false,
  setBalance: (balance) => set({ balance }),
  setTokenBalances: (balances) => set({ tokenBalances: balances }),
  addPurchases: (purchases) => set({ recentPurchases: purchases }),
  setTransactions: (txs) => set({ transactions: txs }),
  setLoading: (loading) => set({ isLoading: loading }),
}));

export class SolanaClient {
  private connection: Connection;

  constructor() {
    this.connection = new Connection(
      `https://mainnet.helius-rpc.com/?api-key=${process.env.NEXT_PUBLIC_HELIUS_API_KEY}`
    );
  }

  async getWalletData(address: string): Promise<void> {
    try {
      const publicKey = new PublicKey(address);
      
      // Get SOL balance, token accounts, and transactions in parallel
      const [balance, tokenAccounts, signatures] = await Promise.all([
        this.connection.getBalance(publicKey),
        this.connection.getParsedTokenAccountsByOwner(publicKey, {
          programId: new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA'),
        }),
        this.connection.getSignaturesForAddress(publicKey, { limit: 50 })
      ]);

      // Process token balances
      const tokenBalances: TokenBalance[] = [];
      for (const account of tokenAccounts.value) {
        const amount = account.account.data.parsed.info.tokenAmount.uiAmount;
        if (amount > 0) {
          const mint = account.account.data.parsed.info.mint;
          const tokenInfo = await this.getTokenInfo(mint);
          if (tokenInfo) {
            tokenBalances.push({
              symbol: tokenInfo.symbol || 'Unknown',
              name: tokenInfo.name || 'Unknown Token',
              amount,
              mint
            });
          }
        }
      }

      // Update balances
      useWalletStore.getState().setBalance(balance / LAMPORTS_PER_SOL);
      useWalletStore.getState().setTokenBalances(tokenBalances);

      // Process transactions
      const transactions: Transaction[] = [];
      const purchases: TokenPurchase[] = [];

      for (const sig of signatures) {
        const tx = await this.connection.getParsedTransaction(sig.signature, {
          maxSupportedTransactionVersion: 0
        });

        if (!tx?.meta) continue;

        const { postTokenBalances, preTokenBalances } = tx.meta;
        const programId = tx.transaction.message.instructions[0]?.programId.toString();

        let type: Transaction['type'] = 'OTHER';
        let inputToken, outputToken;

        // Detect Raydium/Jupiter swaps
        if (programId === 'JUP4Fb2cqiRUcaTHdrPC8h2gNsA2ETXiPDD33WcGuJB' || 
            programId === 'FLhm1pC8v3ckG4FsKgpzyEBxXVqgKBZweFqgPvPMwjhSz') {
          type = 'SWAP';
          
          if (postTokenBalances && preTokenBalances) {
            for (const postBalance of postTokenBalances) {
              const preBalance = preTokenBalances.find(b => b.accountIndex === postBalance.accountIndex);
              const postAmount = Number(postBalance.uiTokenAmount.uiAmount);
              const preAmount = preBalance ? Number(preBalance.uiTokenAmount.uiAmount) : 0;
              
              if (postAmount > preAmount) {
                // Token received (output)
                const tokenInfo = await this.getTokenInfo(postBalance.mint);
                if (tokenInfo) {
                  outputToken = {
                    symbol: tokenInfo.symbol || 'Unknown',
                    amount: postAmount - preAmount,
                    usdValue: await this.getTokenPrice(postBalance.mint, postAmount - preAmount)
                  };
                }
              } else if (postAmount < preAmount) {
                // Token spent (input)
                const tokenInfo = await this.getTokenInfo(postBalance.mint);
                if (tokenInfo) {
                  inputToken = {
                    symbol: tokenInfo.symbol || 'Unknown',
                    amount: preAmount - postAmount,
                    usdValue: await this.getTokenPrice(postBalance.mint, preAmount - postAmount)
                  };
                }
              }
            }
          }
        }

        transactions.push({
          signature: sig.signature,
          timestamp: sig.blockTime || 0,
          type,
          inputToken,
          outputToken,
          programName: this.getProgramName(programId)
        });
      }

      useWalletStore.getState().setTransactions(transactions);

    } catch (error) {
      console.error('Error fetching wallet data:', error);
    }
  }

  private async getTokenInfo(mint: string) {
    try {
      const response = await fetch(`https://public-api.solscan.io/token/meta/${mint}`);
      const data = await response.json();
      return {
        symbol: data.symbol,
        name: data.name
      };
    } catch {
      return null;
    }
  }

  private async getTokenPrice(mint: string, amount: number): Promise<number | undefined> {
    try {
      const response = await fetch(`https://price.jup.ag/v4/price?ids=${mint}`);
      const data = await response.json();
      return data.data[mint]?.price * amount;
    } catch {
      return undefined;
    }
  }

  private getProgramName(programId?: string): string {
    switch (programId) {
      case 'JUP4Fb2cqiRUcaTHdrPC8h2gNsA2ETXiPDD33WcGuJB':
        return 'Jupiter';
      case 'FLhm1pC8v3ckG4FsKgpzyEBxXVqgKBZweFqgPvPMwjhSz':
        return 'Raydium';
      default:
        return 'Unknown Program';
    }
  }
}