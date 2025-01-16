'use client';

import { useWalletStore } from '../lib/solanaClient';

export default function TokenBalances() {
  const tokenBalances = useWalletStore((state) => state.tokenBalances);

  if (!tokenBalances.length) return null;

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">Token Balances</h3>
      <div className="space-y-3">
        {tokenBalances.map((token) => (
          <div key={token.mint} 
            className="p-4 border border-gray-200 rounded-lg hover:border-blue-200 transition-colors duration-200">
            <div className="flex justify-between items-center">
              <div>
                <div className="font-medium text-gray-900">{token.symbol}</div>
                <div className="text-sm text-gray-500">{token.name}</div>
              </div>
              <div className="text-right">
                <div className="text-lg font-semibold text-gray-900">
                  {token.amount.toLocaleString()}
                </div>
                {token.value && (
                  <div className="text-sm text-gray-500">
                    ${token.value.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
} 