export function SectionTitle({ icon: Icon, title, actions }: { icon: any; title: string; actions?: React.ReactNode }) {
    return (
        <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
                <Icon className="h-4 w-4" />
                <h3 className="text-sm font-semibold tracking-wide uppercase text-zinc-600 dark:text-zinc-300">{title}</h3>
            </div>
            <div className="flex items-center gap-2">{actions}</div>
        </div>
    );
}