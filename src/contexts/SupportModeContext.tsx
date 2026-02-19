import { createContext, useContext, useState, ReactNode } from "react";

interface SupportUser {
  id: string;
  nome: string;
  email: string;
  entidade: string;
}

interface SupportModeContextType {
  isSupportMode: boolean;
  supportUser: SupportUser | null;
  enterSupportMode: (user: SupportUser) => void;
  exitSupportMode: () => void;
}

const SupportModeContext = createContext<SupportModeContextType | undefined>(undefined);

export function SupportModeProvider({ children }: { children: ReactNode }) {
  const [isSupportMode, setIsSupportMode] = useState(false);
  const [supportUser, setSupportUser] = useState<SupportUser | null>(null);

  const enterSupportMode = (user: SupportUser) => {
    setSupportUser(user);
    setIsSupportMode(true);
  };

  const exitSupportMode = () => {
    setSupportUser(null);
    setIsSupportMode(false);
  };

  return (
    <SupportModeContext.Provider
      value={{ isSupportMode, supportUser, enterSupportMode, exitSupportMode }}
    >
      {children}
    </SupportModeContext.Provider>
  );
}

export function useSupportMode() {
  const context = useContext(SupportModeContext);
  if (context === undefined) {
    throw new Error("useSupportMode must be used within a SupportModeProvider");
  }
  return context;
}
