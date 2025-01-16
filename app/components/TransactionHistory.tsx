'use client';

import { useState } from 'react';
import { useWalletStore } from '../lib/solanaClient';

const TYPE_COLORS = {
  BUY: 'bg-green-100 text-green-800',
  SELL: 'bg-red-100 text-red-800',
  TRANSFER: 'bg-blue-100 text-blue-800',
  SWAP: 'bg-purple-100 text-purple-800',
  OTHER: 'bg-gray-100 text-gray-800'
};

export default function TransactionHistory() {
  const transactions = useWalletStore((state) => state.transactions);
  const [filter, setFilter] = useState<'ALL' | 'BUY' | 'SELL' | 'TRANSFER' | 'SWAP' | 'OTHER'>('ALL');

  const filteredTransactions = transactions.filter(tx => 
    filter === 'ALL' ? true : tx.type === filter
  );

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-semibold text-gray-800">Transaction History</h3>
        <div className="flex gap-2">
          {['ALL', 'SWAP', 'TRANSFER', 'OTHER'].map((type) => (
            <button
              key={type}
              onClick={() => setFilter(type as any)}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-colors
                ${filter === type ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
            >
              {type}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        {filteredTransactions.map((tx) => (
          <div key={tx.signature} 
            className="p-4 border border-gray-200 rounded-lg hover:border-blue-200 transition-colors duration-200">
            {tx.type === 'SWAP' && tx.inputToken && tx.outputToken ? (
              <>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-sm font-medium text-purple-600">Swap</span>
                  {tx.programName && (
                    <span className="text-xs text-gray-500">on {tx.programName}</span>
                  )}
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-6">
                    <div>
                      <div className="font-medium">{tx.inputToken.amount.toLocaleString()} {tx.inputToken.symbol}</div>
                      {tx.inputToken.usdValue && (
                        <div className="text-sm text-gray-500">${tx.inputToken.usdValue.toFixed(2)}</div>
                      )}
                    </div>
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                    </svg>
                    <div>
                      <div className="font-medium">{tx.outputToken.amount.toLocaleString()} {tx.outputToken.symbol}</div>
                      {tx.outputToken.usdValue && (
                        <div className="text-sm text-gray-500">${tx.outputToken.usdValue.toFixed(2)}</div>
                      )}
                    </div>
                  </div>
                  <time className="text-sm text-gray-500">
                    {new Date(tx.timestamp * 1000).toLocaleString()}
                  </time>
                </div>
              </>
            ) : (
              <div className="flex justify-between items-center">
                <div className="flex items-center space-x-3">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${TYPE_COLORS[tx.type]}`}>
                    {tx.type}
                  </span>
                  {tx.tokenSymbol && (
                    <span className="font-medium text-gray-900">{tx.tokenSymbol}</span>
                  )}
                  {tx.amount && (
                    <span className="text-gray-600">{tx.amount.toLocaleString()}</span>
                  )}
                </div>
                <time className="text-sm text-gray-500">
                  {new Date(tx.timestamp * 1000).toLocaleString()}
                </time>
              </div>
            )}
            <div className="mt-2 flex items-center justify-between text-xs text-gray-500">
              <div className="font-mono">{tx.signature.slice(0, 8)}...{tx.signature.slice(-8)}</div>
              <a 
                href={`https://solscan.io/tx/${tx.signature}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-500 hover:text-blue-600 flex items-center"
              >
                View
                <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </a>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
} 