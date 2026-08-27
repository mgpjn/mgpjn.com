import React from 'react';
import {
  Pill, Syringe, FlaskConical, Leaf, Dumbbell,
  Droplets, Sparkles, Smile, Eye, Stethoscope,
  HeartPulse, ShieldPlus, Layers, Activity, Sparkle
} from 'lucide-react';

export default function CategoryIcon({ slug, name, className = "w-6 h-6" }) {
  const s = (slug || name || '').toLowerCase();

  if (s.includes('tablet')) {
    return <Pill className={className} />;
  }
  if (s.includes('capsule')) {
    return <Layers className={className} />;
  }
  if (s.includes('syrup') || s.includes('suspension') || s.includes('liquid')) {
    return <FlaskConical className={className} />;
  }
  if (s.includes('inject') || s.includes('infusion')) {
    return <Syringe className={className} />;
  }
  if (s.includes('ointment') || s.includes('cream') || s.includes('gel')) {
    return <Droplets className={className} />;
  }
  if (s.includes('fitness') || s.includes('gym') || s.includes('supplement') || s.includes('protein')) {
    return <Dumbbell className={className} />;
  }
  if (s.includes('ayurved') || s.includes('herb') || s.includes('natural')) {
    return <Leaf className={className} />;
  }
  if (s.includes('personal') || s.includes('skin') || s.includes('care') || s.includes('beauty')) {
    return <Sparkles className={className} />;
  }
  if (s.includes('eye') || s.includes('ear') || s.includes('drop')) {
    return <Eye className={className} />;
  }
  if (s.includes('device') || s.includes('surgic') || s.includes('health')) {
    return <Stethoscope className={className} />;
  }

  return <HeartPulse className={className} />;
}
