import Link from 'next/link'
import {
    Filter,
    LayoutGrid,
    ArrowLeftRight,
    Settings,
    Users,
    Building2,
    Trophy,
    TrendingUp,
    Sparkles,
    ArrowRight,
} from 'lucide-react'

const features = [
    {
        title: 'Busca Avançada',
        description: 'Filtros detalhados para encontrar dados específicos com precisão.',
        href: '/monitor/features/busca-avancada',
        icon: Filter,
        color: 'text-indigo-500',
        bg: 'bg-indigo-500/10',
    },
    {
        title: 'Comparador',
        description: 'Compare gastos entre diferentes deputados ou períodos.',
        href: '/monitor/features/comparar',
        icon: ArrowLeftRight,
        color: 'text-pink-500',
        bg: 'bg-pink-500/10',
    },
    {
        title: 'Deputados',
        description: 'Perfis detalhados e histórico de gastos de cada parlamentar.',
        href: '/monitor/features/deputados',
        icon: Users,
        color: 'text-cyan-500',
        bg: 'bg-cyan-500/10',
    },
    {
        title: 'Fornecedores',
        description: 'Análise de empresas e entidades que recebem recursos.',
        href: '/monitor/features/fornecedores',
        icon: Building2,
        color: 'text-orange-500',
        bg: 'bg-orange-500/10',
    },
    {
        title: 'Premiações',
        description: 'Reconhecimento para os parlamentares mais econômicos.',
        href: '/monitor/features/premiacoes',
        icon: Trophy,
        color: 'text-yellow-500',
        bg: 'bg-yellow-500/10',
    },
    {
        title: 'Ranking',
        description: 'Rankings e comparativos de gastos por deputado, partido e estado.',
        href: '/monitor/features/ranking',
        icon: TrendingUp,
        color: 'text-green-500',
        bg: 'bg-green-500/10',
    },
    {
        title: 'Showcase',
        description: 'Demonstração de componentes e funcionalidades do sistema.',
        href: '/monitor/features/showcase',
        icon: Sparkles,
        color: 'text-violet-500',
        bg: 'bg-violet-500/10',
    },
    {
        title: 'Configurações',
        description: 'Personalize sua experiência e preferências do sistema.',
        href: '/monitor/features/configuracoes',
        icon: Settings,
        color: 'text-gray-500',
        bg: 'bg-gray-500/10',
    },
]

export default function FeatureCatalog() {
    return (
        <div className="min-h-screen bg-gradient-to-b from-background to-secondary/20">
            <div className="container mx-auto px-4 py-16 sm:px-6 lg:px-8">
                <div className="text-center max-w-3xl mx-auto mb-16 animate-fade-in">
                    <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-6xl mb-6 bg-clip-text text-transparent bg-gradient-to-r from-primary to-purple-600">
                        Catálogo de Features
                    </h1>
                    <p className="text-lg leading-8 text-muted-foreground">
                        Explore a biblioteca completa de ferramentas e funcionalidades do projeto A República.
                        Transparência e inteligência de dados ao seu alcance.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
                    {features.map((feature, index) => (
                        <Link
                            key={feature.href}
                            href={feature.href}
                            className="group relative flex flex-col p-6 bg-card rounded-2xl shadow-sm border border-border/50 hover:shadow-md hover:border-primary/20 transition-all duration-300 hover:-translate-y-1 animate-slide-up"
                            style={{ animationDelay: `${index * 50}ms` }}
                        >
                            <div className={`h-12 w-12 rounded-xl flex items-center justify-center mb-4 ${feature.bg} ${feature.color} group-hover:scale-110 transition-transform duration-300`}>
                                <feature.icon className="h-6 w-6" />
                            </div>

                            <h3 className="text-xl font-semibold text-foreground mb-2 group-hover:text-primary transition-colors">
                                {feature.title}
                            </h3>

                            <p className="text-muted-foreground flex-grow mb-4 line-clamp-2">
                                {feature.description}
                            </p>

                            <div className="flex items-center text-sm font-medium text-primary opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300">
                                Acessar feature <ArrowRight className="ml-1 h-4 w-4" />
                            </div>
                        </Link>
                    ))}
                </div>

                <div className="mt-20 text-center animate-fade-in" style={{ animationDelay: '600ms' }}>
                    <p className="text-sm text-muted-foreground">
                        &copy; {new Date().getFullYear()} A República. Todos os direitos reservados.
                    </p>
                </div>
            </div>
        </div>
    )
}
