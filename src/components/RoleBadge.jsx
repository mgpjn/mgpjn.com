import React from 'react';
import { Crown, Shield, Star, Briefcase, Building, Store, ShoppingBag, User } from 'lucide-react';

export const ROLE_CONFIG = {
  super_admin: {
    label: 'Super Admin',
    level: 8,
    icon: Crown,
    bg: 'bg-purple-50 text-purple-700 border-purple-200',
    gradient: 'from-purple-600 to-indigo-700 text-white',
  },
  admin: {
    label: 'Admin',
    level: 7,
    icon: Shield,
    bg: 'bg-blue-50 text-blue-700 border-blue-200',
    gradient: 'from-blue-600 to-cyan-700 text-white',
  },
  super_distributor: {
    label: 'Super Distributor',
    level: 6,
    icon: Star,
    bg: 'bg-amber-50 text-amber-800 border-amber-200',
    gradient: 'from-amber-500 to-orange-600 text-white',
  },
  distributor: {
    label: 'Distributor',
    level: 5,
    icon: Briefcase,
    bg: 'bg-sky-50 text-sky-700 border-sky-200',
    gradient: 'from-sky-500 to-blue-600 text-white',
  },
  sub_distributor: {
    label: 'Sub Distributor',
    level: 4,
    icon: Building,
    bg: 'bg-teal-50 text-teal-700 border-teal-200',
    gradient: 'from-teal-500 to-emerald-600 text-white',
  },
  retailer: {
    label: 'Retailer / Chemist',
    level: 3,
    icon: Store,
    bg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    gradient: 'from-emerald-600 to-teal-700 text-white',
  },
  sub_retailer: {
    label: 'Sub Retailer',
    level: 2,
    icon: ShoppingBag,
    bg: 'bg-cyan-50 text-cyan-800 border-cyan-200',
    gradient: 'from-cyan-600 to-blue-600 text-white',
  },
  customer: {
    label: 'Customer',
    level: 1,
    icon: User,
    bg: 'bg-slate-50 text-slate-700 border-slate-200',
    gradient: 'from-slate-600 to-slate-800 text-white',
  },
  member: {
    label: 'Distributor',
    level: 5,
    icon: Briefcase,
    bg: 'bg-sky-50 text-sky-700 border-sky-200',
    gradient: 'from-sky-500 to-blue-600 text-white',
  },
};

export default function RoleBadge({ role, variant = 'badge', showLevel = true, size = 'sm' }) {
  const config = ROLE_CONFIG[role] || ROLE_CONFIG.customer;
  const Icon = config.icon;

  if (variant === 'pill') {
    return (
      <span className={`inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-bold bg-gradient-to-r ${config.gradient} shadow-sm`}>
        <Icon className="w-3.5 h-3.5" />
        <span>{config.label}</span>
        {showLevel && <span className="text-[10px] opacity-80">(L{config.level})</span>}
      </span>
    );
  }

  return (
    <span className={`inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-lg text-xs font-semibold border ${config.bg}`}>
      <Icon className="w-3.5 h-3.5 flex-shrink-0" />
      <span>{config.label}</span>
      {showLevel && <span className="text-[10px] opacity-75 font-bold">L{config.level}</span>}
    </span>
  );
}
