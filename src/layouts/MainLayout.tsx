import type { ReactNode } from "react";
import Header from "../components/Header/Header";

const MainLayout = ({ children }: { children: ReactNode }) => {
  return (
    <div className="bg-gray-50 dark:bg-black min-h-screen border-b-[2rem] border-orange-400">
      <Header />
      <main className="pt-20">{children}</main>
    </div>
  );
};

export default MainLayout;
