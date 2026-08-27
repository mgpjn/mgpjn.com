import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Network, Users, ChevronRight, Award, ShieldCheck, ChevronDown, ArrowLeft, Layers } from 'lucide-react';
import { getGenealogyTree } from '../../services/api';

function TreeNode({ node, level = 1 }) {
  const [expanded, setExpanded] = useState(true);
  const hasChildren = node.children && node.children.length > 0;

  const stageBadge = level === 1
    ? 'Root Partner'
    : level === 2
    ? 'Stage 1 (15% Direct)'
    : level === 3
    ? 'Stage 2 (3% Team)'
    : 'Stage 3 (2% Network)';

  return (
    <div className="flex flex-col items-center">
      {/* Node Card */}
      <div
        className={`p-4 rounded-2xl border-2 transition-all shadow-md text-center max-w-[230px] w-full relative z-10 ${
          level === 1
            ? 'border-brand-blue-900 bg-brand-blue-950 text-white'
            : level === 2
            ? 'border-[#ff5722] bg-orange-50/90 text-slate-900'
            : level === 3
            ? 'border-blue-500 bg-blue-50/90 text-slate-900'
            : 'border-purple-400 bg-purple-50/90 text-slate-900'
        }`}
      >
        <span className={`text-[9px] font-black px-2.5 py-0.5 rounded-full inline-block mb-1 ${
          level === 1 ? 'bg-white/20 text-white' :
          level === 2 ? 'bg-[#ff5722] text-white' :
          level === 3 ? 'bg-blue-600 text-white' :
          'bg-purple-600 text-white'
        }`}>
          {stageBadge}
        </span>
        <h4 className="font-black text-xs truncate">{node.name}</h4>
        <p className="text-[10px] opacity-80 font-mono mt-0.5">ID: {node.referral_code}</p>
        <p className="text-[10px] opacity-75 font-semibold capitalize">{node.role ? node.role.replace('_', ' ') : 'Customer'}</p>

        <div className="mt-2 pt-2 border-t border-black/10 flex justify-between text-[10px] font-bold">
          <span>Directs: {node.stage1_referrals_count || 0}</span>
          <span className="text-emerald-500 font-black">₹{(node.total_earned || 0).toFixed(0)}</span>
        </div>

        {hasChildren && (
          <button
            onClick={() => setExpanded(!expanded)}
            className="mt-2 text-[10px] font-bold underline opacity-80 cursor-pointer"
          >
            {expanded ? '▲ Collapse Team' : `▼ Expand Team (${node.children.length})`}
          </button>
        )}
      </div>

      {/* Downlines Children branch */}
      {hasChildren && expanded && (
        <div className="relative pt-6 flex flex-wrap justify-center gap-6 before:absolute before:top-0 before:left-1/2 before:-translate-x-1/2 before:w-0.5 before:h-6 before:bg-slate-300">
          {node.children.map((child) => (
            <TreeNode key={child.id} node={child} level={level + 1} />
          ))}
        </div>
      )}
    </div>
  );
}

export default function GenealogyTree() {
  const [tree, setTree] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getGenealogyTree()
      .then((res) => {
        if (res.data.success) {
          setTree(res.data.tree);
        }
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Link to="/mlm" className="text-xs font-bold text-brand-blue-800 hover:underline flex items-center space-x-1 mb-1">
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Referral Income Dashboard</span>
          </Link>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Referral Network Hierarchy Tree</h1>
          <p className="text-xs text-slate-500">Visual breakdown of your 3-Stage referral income network downlines.</p>
        </div>
      </div>

      <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-sm overflow-x-auto min-h-[500px] flex items-start justify-center">
        {loading ? (
          <p className="text-xs text-slate-400 py-16">Loading referral network tree...</p>
        ) : tree ? (
          <div className="py-4">
            <TreeNode node={tree} level={1} />
          </div>
        ) : (
          <p className="text-xs text-slate-400 py-16">No network data available.</p>
        )}
      </div>
    </div>
  );
}
