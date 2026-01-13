type PageHeaderProps = {
    title: string;
    subtitle?: string;
    badge?: string;
    rightContent?: React.ReactNode;
};

export default function PageHeader({ title, subtitle, badge, rightContent }: PageHeaderProps) {
    return (
        <div className="glass-light rounded-2xl border border-emerald-100/70 px-5 py-4 sm:px-6 sm:py-5 mb-6">
            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
                <div>
                {badge && (
                    <span className="inline-flex items-center px-2.5 py-1 text-xs font-semibold text-emerald-800 bg-emerald-100/80 rounded-xl border border-emerald-200/60 mb-2">
                        {badge}
                    </span>
                )}
                <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-gray-900">
                    <span className="text-gradient">{title}</span>
                </h1>
                {subtitle && <p className="text-sm text-slate-600 mt-1 max-w-3xl">{subtitle}</p>}
                </div>
                {rightContent && (
                    <div className="flex items-center gap-2">
                        {rightContent}
                    </div>
                )}
            </div>
        </div>
    );
}
