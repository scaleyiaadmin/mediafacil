import { Link } from "react-router-dom";
import { Building2, Users, Database, Truck, ArrowRight, BarChart3, ArrowLeft } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/button";

const adminModules = [
  {
    title: "Gestão de Entidades",
    description: "Cadastrar e gerenciar prefeituras e entidades",
    icon: Building2,
    href: "/admin/entidades",
    count: 45,
    label: "Entidades ativas",
  },
  {
    title: "Gestão de Usuários",
    description: "Visualizar e gerenciar usuários das entidades",
    icon: Users,
    href: "/admin/usuarios",
    count: 128,
    label: "Usuários cadastrados",
  },
  {
    title: "Gestão de Tabelas",
    description: "Gerenciar tabelas de preços (PNCP, BPS, etc)",
    icon: Database,
    href: "/admin/tabelas",
    count: 5,
    label: "Tabelas ativas",
  },
  {
    title: "Gestão de Fornecedores",
    description: "Gerenciar fornecedores e segmentos do sistema",
    icon: Truck,
    href: "/admin/fornecedores",
    count: 312,
    label: "Fornecedores cadastrados",
  },
];

const statsCards = [
  { label: "Total de Orçamentos", value: "1.547", change: "+12% este mês" },
  { label: "Entidades Ativas", value: "45", change: "+3 novas" },
  { label: "Fornecedores Ativos", value: "312", change: "+18 este mês" },
  { label: "Média de Respostas", value: "78%", change: "+5% melhoria" },
];

export default function AdminDashboard() {
  return (
    <div className="min-h-screen bg-background">
      <Header title="Painel Administrativo" subtitle="Administração do Sistema Média Fácil" />
      
      <main className="container mx-auto px-6 py-6">
        <div className="space-y-8">
          {/* Back to client area */}
          <Link to="/">
            <Button variant="ghost" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Voltar ao Sistema do Cliente
            </Button>
          </Link>

          {/* Page Title */}
          <div>
            <h1 className="text-2xl font-bold text-foreground">Painel Administrativo</h1>
            <p className="text-muted-foreground">Administração do Sistema Média Fácil</p>
          </div>

          {/* Stats Overview */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {statsCards.map((stat) => (
              <Card key={stat.label}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">{stat.label}</p>
                      <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                    </div>
                    <BarChart3 className="h-8 w-8 text-muted-foreground/30" />
                  </div>
                  <p className="text-xs text-success mt-2">{stat.change}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Admin Modules */}
          <div>
            <h2 className="text-lg font-semibold text-foreground mb-4">Módulos de Administração</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {adminModules.map((module) => {
                const Icon = module.icon;
                return (
                  <Link key={module.href} to={module.href}>
                    <Card className="hover:shadow-md hover:border-primary/30 transition-all cursor-pointer h-full">
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary">
                            <Icon className="h-6 w-6" />
                          </div>
                          <ArrowRight className="h-5 w-5 text-muted-foreground" />
                        </div>
                      </CardHeader>
                      <CardContent>
                        <CardTitle className="text-lg mb-1">{module.title}</CardTitle>
                        <CardDescription className="mb-3">{module.description}</CardDescription>
                        <div className="flex items-center gap-2 text-sm">
                          <span className="font-semibold text-primary">{module.count}</span>
                          <span className="text-muted-foreground">{module.label}</span>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
