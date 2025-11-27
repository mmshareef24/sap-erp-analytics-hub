import Dashboard from './pages/Dashboard';
import Sales from './pages/Sales';
import Inventory from './pages/Inventory';
import Finance from './pages/Finance';
import Purchase from './pages/Purchase';
import Production from './pages/Production';
import Insights from './pages/Insights';
import __Layout from './Layout.jsx';


export const PAGES = {
    "Dashboard": Dashboard,
    "Sales": Sales,
    "Inventory": Inventory,
    "Finance": Finance,
    "Purchase": Purchase,
    "Production": Production,
    "Insights": Insights,
}

export const pagesConfig = {
    mainPage: "Dashboard",
    Pages: PAGES,
    Layout: __Layout,
};