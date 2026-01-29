type SectionHeaderProps = {
    title: string;
    color?: 'emerald' | 'teal' | 'amber' | 'gray';
};

export default function SectionHeader({ title, color = 'emerald' }: SectionHeaderProps) {
    const colorMap = {
        emerald: 'from-emerald-500/50',
        teal: 'from-teal-500/50',
        amber: 'from-amber-500/50',
        gray: 'from-gray-400/50'
    };

    return (
        <div className="flex items-center gap-3 mb-4">
            <div className={`h-px flex-1 bg-gradient-to-r ${colorMap[color]} to-transparent`} />
            <h2 className="text-sm font-semibold text-gray-600 uppercase tracking-wider">{title}</h2>
            <div className={`h-px flex-1 bg-gradient-to-l ${colorMap[color]} to-transparent`} />
        </div>
    );
}
