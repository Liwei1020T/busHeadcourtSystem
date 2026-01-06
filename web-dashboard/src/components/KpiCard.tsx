import { motion } from 'framer-motion';
import CountUp from 'react-countup';
import { Card } from '@/components/ui/card';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

type KpiCardProps = {
  title: string;
  value: string | number | null;
  subtitle?: string;
  icon?: React.ReactNode;
  color?: 'green' | 'teal' | 'amber' | 'red';
  onClick?: () => void;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
  variant?: 'default' | 'hero' | 'compact';
};

export default function KpiCard({
  title,
  value,
  subtitle,
  icon,
  color = 'green',
  onClick,
  trend,
  trendValue,
  variant = 'default'
}: KpiCardProps) {
  const displayValue = value === null || value === '' ? '—' : value;
  const numericValue = typeof value === 'number' ? value : parseFloat(String(value)) || 0;
  const isNumeric = typeof value === 'number' || (typeof value === 'string' && !isNaN(parseFloat(value)));

  const colorMap = {
    green: {
      gradient: 'from-emerald-500 via-emerald-600 to-teal-600',
      border: 'border-emerald-200',
      text: 'text-emerald-600',
      icon: 'text-emerald-600',
      light: 'bg-gradient-to-br from-emerald-50 to-teal-50',
      shadow: 'shadow-emerald-500/20'
    },
    teal: {
      gradient: 'from-teal-500 via-teal-600 to-cyan-600',
      border: 'border-teal-200',
      text: 'text-teal-600',
      icon: 'text-teal-600',
      light: 'bg-gradient-to-br from-teal-50 to-cyan-50',
      shadow: 'shadow-teal-500/20'
    },
    amber: {
      gradient: 'from-amber-500 via-orange-500 to-orange-600',
      border: 'border-amber-200',
      text: 'text-amber-600',
      icon: 'text-amber-600',
      light: 'bg-gradient-to-br from-amber-50 to-orange-50',
      shadow: 'shadow-amber-500/20'
    },
    red: {
      gradient: 'from-rose-500 via-red-500 to-pink-600',
      border: 'border-rose-200',
      text: 'text-rose-600',
      icon: 'text-rose-600',
      light: 'bg-gradient-to-br from-rose-50 to-pink-50',
      shadow: 'shadow-rose-500/20'
    }
  };

  const colors = colorMap[color];

  const TrendIcon = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : Minus;
  const trendColor = trend === 'up' ? 'text-emerald-600' : trend === 'down' ? 'text-red-600' : 'text-gray-400';

  // Hero variant
  if (variant === 'hero') {
    return (
      <motion.div
        whileHover={{ y: -6, transition: { duration: 0.3 } }}
        className="h-full"
      >
        <Card
          className={`
            relative overflow-hidden p-8 h-full border-0
            bg-gradient-to-br ${colors.gradient}
            shadow-2xl ${colors.shadow}
            ${onClick ? 'cursor-pointer' : ''}
          `}
          onClick={onClick}
        >
          {/* Decorative elements */}
          <div className="absolute -top-10 -right-10 w-32 h-32 rounded-full bg-white/10 blur-2xl" />
          <div className="absolute -bottom-10 -left-10 w-40 h-40 rounded-full bg-white/5 blur-3xl" />

          <div className="relative">
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="text-sm font-semibold text-white/80 uppercase tracking-wider mb-2">
                  {title}
                </p>
                <p className="text-5xl font-extrabold text-white">
                  {isNumeric ? (
                    <CountUp
                      end={numericValue}
                      duration={1.8}
                      separator=","
                      preserveValue
                    />
                  ) : (
                    displayValue
                  )}
                </p>
              </div>
              {icon && (
                <div className="p-4 rounded-2xl bg-white/20 backdrop-blur-sm">
                  <div className="text-white">
                    {icon}
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between mt-6">
              {subtitle && (
                <p className="text-sm text-white/70 font-medium">{subtitle}</p>
              )}
              {trend && trendValue && (
                <div className="flex items-center gap-1.5 bg-white/20 rounded-full px-3 py-1">
                  <TrendIcon className="w-4 h-4 text-white" />
                  <span className="text-sm font-semibold text-white">{trendValue}</span>
                </div>
              )}
            </div>
          </div>
        </Card>
      </motion.div>
    );
  }

  // Compact variant
  if (variant === 'compact') {
    return (
      <motion.div
        whileHover={{ scale: 1.02, y: -2, transition: { duration: 0.2 } }}
        className="h-full"
      >
        <Card
          className={`
            relative overflow-hidden px-5 py-4 h-full
            border-l-4 ${colors.border}
            hover:shadow-xl hover:shadow-emerald-100/50
            ${onClick ? 'cursor-pointer' : ''}
          `}
          onClick={onClick}
        >
          <div className="flex items-center gap-4">
            {icon && (
              <div className={`p-2.5 rounded-xl ${colors.light}`}>
                <div className={colors.icon}>
                  {icon}
                </div>
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-xs text-gray-500 font-semibold uppercase tracking-wide truncate">
                {title}
              </p>
              <p className={`text-2xl font-bold ${colors.text}`}>
                {isNumeric ? (
                  <CountUp
                    end={numericValue}
                    duration={1}
                    separator=","
                    preserveValue
                  />
                ) : (
                  displayValue
                )}
              </p>
            </div>
            {trend && (
              <div className={`p-1.5 rounded-lg ${trend === 'up' ? 'bg-emerald-50' : trend === 'down' ? 'bg-red-50' : 'bg-gray-50'}`}>
                <TrendIcon className={`w-4 h-4 ${trendColor}`} />
              </div>
            )}
          </div>
        </Card>
      </motion.div>
    );
  }

  // Default variant
  return (
    <motion.div
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
      whileTap={{ scale: 0.98 }}
      className="h-full"
    >
      <Card
        className={`
          relative overflow-hidden p-6 h-full
          border-l-4 ${colors.border}
          hover:shadow-xl hover:shadow-emerald-100/50
          ${onClick ? 'cursor-pointer' : ''}
        `}
        onClick={onClick}
      >
        <div className={`absolute inset-0 ${colors.light} opacity-30`} />

        <div className="relative flex items-center justify-between">
          <div className="flex-1">
            <p className="text-xs text-gray-500 font-semibold uppercase tracking-wide mb-2">
              {title}
            </p>
            <p className={`text-4xl font-extrabold ${colors.text}`}>
              {isNumeric ? (
                <CountUp
                  end={numericValue}
                  duration={1.5}
                  separator=","
                  preserveValue
                />
              ) : (
                displayValue
              )}
            </p>
            {subtitle && (
              <p className="text-sm text-gray-500 mt-2">{subtitle}</p>
            )}
          </div>
          {icon && (
            <div className={`p-4 rounded-2xl ${colors.light}`}>
              <div className={colors.icon}>
                {icon}
              </div>
            </div>
          )}
        </div>

        {trend && trendValue && (
          <div className={`flex items-center gap-1.5 mt-4 ${trendColor}`}>
            <TrendIcon className="w-4 h-4" />
            <span className="text-sm font-semibold">{trendValue}</span>
          </div>
        )}
      </Card>
    </motion.div>
  );
}
