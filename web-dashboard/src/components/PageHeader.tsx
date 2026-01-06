type PageHeaderProps = {
    title: string;
    subtitle?: string;
    badge?: string;
    rightContent?: React.ReactNode;
};

export default function PageHeader({ title, subtitle, badge, rightContent }: PageHeaderProps) {
    return (
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-6">
            <div>
                {badge && (
                    <span className="inline-block px-2.5 py-0.5 text-xs font-semibold text-emerald-700 bg-emerald-100 rounded-lg mb-2">
                        {badge}
                    </span>
                )}
                <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
                {subtitle && <p className="text-sm text-gray-500 mt-1">{subtitle}</p>}
            </div>
            {rightContent && (
                <div className="flex items-center gap-2">
                    {rightContent}
                </div>
            )}
        </div>
    );
}
