import type { ReactNode } from "react";
import Navigation from "../navigation/Navigation";

const Layout = ({ children }: { children: ReactNode }) => {
    return (
        <div className="flex flex-col min-h-screen bg-gray-50">
            <main className="flex-1">{children}</main>
            <Navigation /> {/* siempre visible en todas las páginas */}
        </div>
    );
};


export default Layout;
