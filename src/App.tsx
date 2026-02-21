import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
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
import CestaPrecos from "./pages/CestaPrecos";
import AtaRegistroPrecos from "./pages/AtaRegistroPrecos";
import SelecaoItensImportados from "./pages/SelecaoItensImportados";
import Login from "./pages/Login";
import NotFound from "./pages/NotFound";

import { AuthProvider } from "@/contexts/AuthContext";

import { ProtectedRoute } from "@/components/auth/ProtectedRoute";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <SupportModeProvider>
          <SidebarProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <Routes>
                {/* Public Routes */}
                <Route path="/login" element={<Login />} />
                <Route path="/proposta/:token" element={<PropostaFornecedor />} />

                {/* Protected Routes */}
                <Route path="/" element={<Navigate to="/dashboard" replace />} />
                <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
                <Route path="/novo-orcamento" element={<ProtectedRoute><NovoOrcamento /></ProtectedRoute>} />
                <Route path="/buscar-itens" element={<ProtectedRoute><BuscarItens /></ProtectedRoute>} />
                <Route path="/buscar-itens-manual" element={<ProtectedRoute><BuscarItensManual /></ProtectedRoute>} />
                <Route path="/configurar-busca" element={<ProtectedRoute><ConfigurarBusca /></ProtectedRoute>} />
                <Route path="/selecao-itens-importados" element={<ProtectedRoute><SelecaoItensImportados /></ProtectedRoute>} />
                <Route path="/resultado-busca" element={<ProtectedRoute><ResultadoBusca /></ProtectedRoute>} />
                <Route path="/solicitar-fornecedores" element={<ProtectedRoute><SolicitarFornecedores /></ProtectedRoute>} />
                <Route path="/orcamento/:id" element={<ProtectedRoute><VisaoOrcamento /></ProtectedRoute>} />
                <Route path="/cesta-precos" element={<ProtectedRoute><CestaPrecos /></ProtectedRoute>} />
                <Route path="/ata-registro-precos" element={<ProtectedRoute><AtaRegistroPrecos /></ProtectedRoute>} />
                <Route path="/relatorio-final" element={<ProtectedRoute><RelatorioFinal /></ProtectedRoute>} />
                <Route path="/orcamentos" element={<ProtectedRoute><ListaOrcamentos /></ProtectedRoute>} />
                <Route path="/fornecedores" element={<ProtectedRoute><Fornecedores /></ProtectedRoute>} />
                <Route path="/perfil-configuracoes" element={<ProtectedRoute><PerfilConfiguracoes /></ProtectedRoute>} />

                {/* Admin Routes */}
                <Route path="/admin" element={<ProtectedRoute><AdminDashboard /></ProtectedRoute>} />
                <Route path="/admin/entidades" element={<ProtectedRoute><AdminEntidades /></ProtectedRoute>} />
                <Route path="/admin/usuarios" element={<ProtectedRoute><AdminUsuarios /></ProtectedRoute>} />
                <Route path="/admin/tabelas" element={<ProtectedRoute><AdminTabelas /></ProtectedRoute>} />
                <Route path="/admin/fornecedores" element={<ProtectedRoute><AdminFornecedores /></ProtectedRoute>} />

                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
          </SidebarProvider>
        </SupportModeProvider>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
