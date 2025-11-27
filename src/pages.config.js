import Dashboard from './pages/Dashboard';
import Sales from './pages/Sales';
import Inventory from './pages/Inventory';
import Finance from './pages/Finance';
import Purchase from './pages/Purchase';
import Production from './pages/Production';
import Insights from './pages/Insights';
import Reports from './pages/Reports';
import SupplyChain from './pages/SupplyChain';
import CrossModuleAnalytics from './pages/CrossModuleAnalytics';
import Deliveries from './pages/Deliveries';
import CustomDashboard from './pages/CustomDashboard';
import UserRoleManagement from './pages/UserRoleManagement';
import __Layout from './Layout.jsx';


export const PAGES = {
    "Dashboard": Dashboard,
    "Sales": Sales,
    "Inventory": Inventory,
    "Finance": Finance,
    "Purchase": Purchase,
    "Production": Production,
    "Insights": Insights,
    "Reports": Reports,
    "SupplyChain": SupplyChain,
    "CrossModuleAnalytics": CrossModuleAnalytics,
    "Deliveries": Deliveries,
    "CustomDashboard": CustomDashboard,
    "UserRoleManagement": UserRoleManagement,
}

export const pagesConfig = {
    mainPage: "Dashboard",
    Pages: PAGES,
    Layout: __Layout,
};