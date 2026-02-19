import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { SidebarProvider } from "@/contexts/SidebarContext";
import { SupportModeProvider } from "@/contexts/SupportModeContext";
import Dashboard from "./pages/Dashboard";
import NovoOrcamento from "./pages/NovoOrcamento";
import BuscarItens from "./pages/BuscarItens";
import ConfigurarBusca from "./pages/ConfigurarBusca";
import ResultadoBusca from "./pages/ResultadoBusca";
import SolicitarFornecedores from "./pages/SolicitarFornecedores";
import VisaoOrcamento from "./pages/VisaoOrcamento";
import RelatorioFinal from "./pages/RelatorioFinal";
import ListaOrcamentos from "./pages/ListaOrcamentos";
import Fornecedores from "./pages/Fornecedores";
import BuscarItensManual from "./pages/BuscarItensManual";
import PerfilConfiguracoes from "./pages/PerfilConfiguracoes";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminEntidades from "./pages/admin/AdminEntidades";
import AdminUsuarios from "./pages/admin/AdminUsuarios";
import AdminTabelas from "./pages/admin/AdminTabelas";
import AdminFornecedores from "./pages/admin/AdminFornecedores";
import PropostaFornecedor from "./pages/PropostaFornecedor";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <SupportModeProvider>
        <SidebarProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/novo-orcamento" element={<NovoOrcamento />} />
              <Route path="/buscar-itens" element={<BuscarItens />} />
              <Route path="/buscar-itens-manual" element={<BuscarItensManual />} />
              <Route path="/configurar-busca" element={<ConfigurarBusca />} />
              <Route path="/resultado-busca" element={<ResultadoBusca />} />
              <Route path="/solicitar-fornecedores" element={<SolicitarFornecedores />} />
              <Route path="/orcamento/:id" element={<VisaoOrcamento />} />
              <Route path="/relatorio-final" element={<RelatorioFinal />} />
              <Route path="/orcamentos" element={<ListaOrcamentos />} />
              <Route path="/fornecedores" element={<Fornecedores />} />
              <Route path="/perfil-configuracoes" element={<PerfilConfiguracoes />} />
              {/* Admin Routes */}
              <Route path="/admin" element={<AdminDashboard />} />
              <Route path="/admin/entidades" element={<AdminEntidades />} />
              <Route path="/admin/usuarios" element={<AdminUsuarios />} />
              <Route path="/admin/tabelas" element={<AdminTabelas />} />
              <Route path="/admin/fornecedores" element={<AdminFornecedores />} />
              {/* Proposta Digital do Fornecedor (acesso via link) */}
              <Route path="/proposta/:token" element={<PropostaFornecedor />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </SidebarProvider>
      </SupportModeProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
