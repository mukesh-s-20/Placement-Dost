import React, { useState, useEffect } from 'react';
import { api } from '../services/api.js';
import { useAuth } from '../context/AuthContext.jsx';
import { Coins, Table, History, X, ArrowUpRight, ArrowDownRight } from 'lucide-react';

export const PointsLedgerModal = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('ledger'); // 'ledger' | 'rules'
  const [ledger, setLedger] = useState([]);
  const [config, setConfig] = useState(null);

  useEffect(() => {
    if (isOpen) {
      Promise.all([
        api.getPointsLedger(user?.id),
        api.getPointsConfig()
      ]).then(([ledgerRes, configRes]) => {
        setLedger(ledgerRes.ledger || []);
        setConfig(configRes.pointsConfig);
      }).catch(err => console.error(err));
    }
  }, [isOpen, user?.id]);

  if (!isOpen) return null;

  return (
    <div className="modal-backdrop">
      <div className="ledger-modal-content">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-200 pb-3 mb-4">
          <div className="flex items-center gap-2">
            <Coins className="w-5 h-5 text-slate-800" />
            <div>
              <h3 className="text-base font-bold text-slate-900">Points & Rules Ledger</h3>
              <p className="text-xs text-slate-500">Config Table & Real-Time Audit Log (§7 & §10)</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-700 rounded">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* User Balance Overview */}
        <div className="p-3 bg-slate-50 rounded border border-slate-200 flex items-center justify-between mb-4">
          <div>
            <span className="text-xs text-slate-500">Current Balance</span>
            <div className="text-xl font-bold text-slate-900 flex items-center gap-1.5">
              <span>{user?.points ?? 0}</span>
              <span className="text-xs font-normal text-slate-500">pts</span>
            </div>
          </div>
          <div className="text-right text-xs text-slate-600">
            <p>Daily Streak: <strong className="text-slate-900">{user?.streakDaily || 1} days</strong></p>
            <p>Free Step-outs: <strong className="text-slate-900">{user?.freeExitsRemaining ?? 3}/3 remaining</strong></p>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-slate-200 mb-4">
          <button
            onClick={() => setActiveTab('ledger')}
            className={`pb-2 px-4 text-xs font-semibold flex items-center gap-1.5 border-b-2 transition-all ${
              activeTab === 'ledger'
                ? 'border-blue-900 text-blue-900'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>Audit Ledger ({ledger.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('rules')}
            className={`pb-2 px-4 text-xs font-semibold flex items-center gap-1.5 border-b-2 transition-all ${
              activeTab === 'rules'
                ? 'border-blue-900 text-blue-900'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <Table className="w-3.5 h-3.5" />
            <span>Config Table (Rules & Rates)</span>
          </button>
        </div>

        {/* Content Tabs */}
        {activeTab === 'ledger' ? (
          <div className="ledger-scroll-area">
            {ledger.length > 0 ? (
              <div className="space-y-1.5">
                {ledger.map(item => (
                  <div
                    key={item.id}
                    className="p-2.5 bg-white border border-slate-200 rounded flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center gap-2">
                      <div className="p-1 rounded bg-slate-100 text-slate-700">
                        {item.pointsDelta >= 0 ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
                      </div>
                      <div>
                        <p className="font-semibold text-slate-900 leading-tight">{item.description}</p>
                        <p className="text-[10px] text-slate-400">{new Date(item.createdAt).toLocaleString()}</p>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="font-bold text-slate-900">
                        {item.pointsDelta >= 0 ? `+${item.pointsDelta}` : item.pointsDelta} pts
                      </span>
                      <span className="block text-[10px] text-slate-500">Bal: {item.balanceAfter}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-xs text-slate-400">
                No ledger transactions recorded yet.
              </div>
            )}
          </div>
        ) : (
          <div className="ledger-scroll-area">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500 font-semibold">
                  <th className="py-2 px-2">Platform Action</th>
                  <th className="py-2 px-2 text-right">Points</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                <tr>
                  <td className="py-2 px-2">Daily login consistency</td>
                  <td className="py-2 px-2 text-right font-bold text-slate-900">+{config?.DAILY_LOGIN ?? 1}</td>
                </tr>
                <tr>
                  <td className="py-2 px-2">Solve DSA problem — Easy</td>
                  <td className="py-2 px-2 text-right font-bold text-slate-900">+{config?.SOLVE_DSA_EASY ?? 3}</td>
                </tr>
                <tr>
                  <td className="py-2 px-2">Solve DSA problem — Medium</td>
                  <td className="py-2 px-2 text-right font-bold text-slate-900">+{config?.SOLVE_DSA_MEDIUM ?? 8}</td>
                </tr>
                <tr>
                  <td className="py-2 px-2">Solve DSA problem — Hard</td>
                  <td className="py-2 px-2 text-right font-bold text-slate-900">+{config?.SOLVE_DSA_HARD ?? 10}</td>
                </tr>
                <tr>
                  <td className="py-2 px-2">Maintain daily streak → weekly milestone</td>
                  <td className="py-2 px-2 text-right font-bold text-slate-900">+{config?.MAINTAIN_DAILY_STREAK ?? 1}</td>
                </tr>
                <tr>
                  <td className="py-2 px-2">Complete late / overdue problem</td>
                  <td className="py-2 px-2 text-right font-bold text-slate-900">+{config?.COMPLETE_OVERDUE_PROBLEM ?? 1}</td>
                </tr>
                <tr>
                  <td className="py-2 px-2">Complete a learning sub-module</td>
                  <td className="py-2 px-2 text-right font-bold text-slate-900">+{config?.COMPLETE_SUBMODULE ?? 1}</td>
                </tr>
                <tr>
                  <td className="py-2 px-2">Fully re-complete a module</td>
                  <td className="py-2 px-2 text-right font-bold text-slate-900">+{config?.RECOMPLETE_MODULE ?? 1}</td>
                </tr>
                <tr>
                  <td className="py-2 px-2">Help another student via peer-to-peer (base session)</td>
                  <td className="py-2 px-2 text-right font-bold text-slate-900">+{config?.PEER_SESSION_HELPER ?? 15}</td>
                </tr>
                <tr>
                  <td className="py-2 px-2">Peer session bonus (helpee remediation improvement)</td>
                  <td className="py-2 px-2 text-right font-bold text-slate-900">+{config?.PEER_SESSION_BONUS_IMPROVEMENT ?? 5}</td>
                </tr>
                <tr className="bg-slate-50">
                  <td className="py-2 px-2">Focus Mode early exit (4th+ exit beyond 3 free)</td>
                  <td className="py-2 px-2 text-right font-bold text-slate-900">-{config?.EXIT_BASE_COST ?? 5} (scaling)</td>
                </tr>
              </tbody>
            </table>
          </div>
        )}

        <div className="mt-4 pt-3 border-t border-slate-200 flex justify-end">
          <button onClick={onClose} className="btn-primary text-xs py-1.5 px-4">
            Close Audit
          </button>
        </div>
      </div>
    </div>
  );
};
