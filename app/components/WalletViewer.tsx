'use client';

import { useState } from 'react';
import { SolanaClient, useWalletStore } from '../lib/solanaClient';
import TokenBalances from './TokenBalances';
import TransactionHistory from './TransactionHistory';

export default function WalletViewer() {
  const [address, setAddress] = useState('');
  const { balance, recentPurchases, isLoading } = useWalletStore();
  const solanaClient = new SolanaClient();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    useWalletStore.getState().setLoading(true);
    await solanaClient.getWalletData(address);
    useWalletStore.getState().setLoading(false);
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6 text-gray-800">Solana Wallet Viewer</h1>
      
      <div className="bg-white rounded-lg shadow-md p-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-1">
              Wallet Address
            </label>
            <input
              id="address"
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Enter Solana wallet address"
              className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <button 
            type="submit"
            disabled={isLoading}
            className={`w-full py-3 px-4 bg-blue-500 text-white rounded-md font-medium
              ${!isLoading && 'hover:bg-blue-600'} 
              transition-colors duration-200
              disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {isLoading ? (
              <div className="flex items-center justify-center">
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                Loading...
              </div>
            ) : (
              'Check Wallet'
            )}
          </button>
        </form>
      </div>

      {isLoading && (
        <div className="mt-8 space-y-4">
          <div className="h-24 bg-gray-100 rounded-lg animate-pulse" />
          <div className="h-48 bg-gray-100 rounded-lg animate-pulse" />
        </div>
      )}

      {!isLoading && balance > 0 && (
        <div className="mt-8 space-y-6">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-gray-500">SOL Balance</h3>
                <p className="text-2xl font-bold text-gray-800">{balance.toFixed(4)} SOL</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>

          <TokenBalances />

          {recentPurchases.length > 0 && (
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Recent Token Purchases</h3>
              <div className="space-y-3">
                {recentPurchases.map((purchase) => (
                  <div key={purchase.signature} 
                    className="p-4 border border-gray-200 rounded-lg hover:border-blue-200 transition-colors duration-200">
                    <div className="flex justify-between items-center">
                      <div>
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          BUY
                        </span>
                        <span className="ml-2 font-medium text-gray-900">{purchase.tokenSymbol}</span>
                      </div>
                      <span className="text-lg font-semibold text-gray-900">
                        {purchase.amount.toLocaleString()}
                      </span>
                    </div>
                    <div className="mt-2 flex items-center justify-between text-sm text-gray-500">
                      <time>{new Date(purchase.timestamp * 1000).toLocaleString()}</time>
                      <a 
                        href={`https://solscan.io/tx/${purchase.signature}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-500 hover:text-blue-600 flex items-center"
                      >
                        View Transaction
                        <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <TransactionHistory />
        </div>
      )}
    </div>
  );
} 