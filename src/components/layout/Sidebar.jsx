import React, { useState } from "react";
import {
  LayoutDashboard,
  Users,
  Package,
  ShoppingCart,
  ShoppingBag,
  MonitorPlay,
  Building2,
  UserCheck,
  FileText,
  Menu,
  X,
  LogOut,
  ChevronDown,
  ChevronRight,
  Wallet,
} from "lucide-react";

import { cn } from "../../lib/utils";
import { Link, useLocation, useNavigate } from "react-router-dom";
import Swal from "sweetalert2";

const SidebarItem = ({
  icon: Icon,
  label,
  href,
  active,
  onClick,
  subItems,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();

  const isSubItemActive = subItems?.some(
    (item) => location.pathname === item.href
  );
  const isMainActive = active || isSubItemActive;

  const handleClick = (e) => {
    if (subItems) {
      e.preventDefault();
      setIsOpen(!isOpen);
    } else {
      onClick && onClick();
    }
  };

  useState(() => {
    if (isSubItemActive) setIsOpen(true);
  }, [isSubItemActive]);

  return (
    <div className="flex flex-col">
      <Link
        to={subItems ? "#" : href}
        onClick={handleClick}
        className={cn(
          "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 group relative overflow-hidden cursor-pointer",
          isMainActive && !subItems
            ? "bg-[#b4933d]/10 text-[#b4933d] border-r-4 border-[#b4933d]"
            : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
        )}
      >
        <Icon
          size={20}
          className={cn(
            "transition-all duration-300 shrink-0",
            isMainActive
              ? "text-[#b4933d]"
              : "text-gray-400 group-hover:text-gray-600"
          )}
        />
        <div className="flex-1 flex justify-between items-center">
          <span className="font-semibold text-sm">{label}</span>
          {subItems &&
            (isOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />)}
        </div>
      </Link>

      {/* Submenu */}
      {subItems && isOpen && (
        <div className="ml-4 mt-1 space-y-1 border-l border-gray-200 pl-3">
          {subItems.map((sub, index) => {
            const isChildActive = location.pathname === sub.href;
            return (
              <Link
                key={index}
                to={sub.href}
                onClick={onClick}
                className={cn(
                  "flex items-center gap-3 px-4 py-2 rounded-lg text-sm transition-all duration-200",
                  isChildActive
                    ? "bg-[#b4933d]/10 text-[#b4933d] font-bold"
                    : "text-gray-500 hover:text-gray-900 hover:bg-gray-50"
                )}
              >
                {sub.label}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
};

const Sidebar = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const currentPath = location.pathname;

  const handleLogout = async () => {
    const result = await Swal.fire({
      title: "Logout Confirmation",
      text: "Are you sure you want to logout?",
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: "#dc2626",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "Yes, Logout",
      cancelButtonText: "Cancel",
      reverseButtons: true,
    });

    if (result.isConfirmed) {
      localStorage.removeItem("isLoggedIn");
      navigate("/login");
    }
  };

  const toggleMobileMenu = () => setIsMobileMenuOpen(!isMobileMenuOpen);
  const closeMobileMenu = () => setIsMobileMenuOpen(false);

  const menuItems = [
    { icon: LayoutDashboard, label: "Dashboard", href: "/" },
    { icon: Building2, label: "Cash & Bank", href: "/cash-bank" },
    { icon: Users, label: "Parties", href: "/parties" },
    {
      icon: Package,
      label: "Items",
      href: "/items",
      subItems: [
        { label: "Inventory", href: "/items/inventory" },
        { label: "Godown (Warehouse)", href: "/items/godown" },
      ],
    },
    {
      icon: ShoppingBag,
      label: "Sales",
      href: "/sales",
      subItems: [
        { label: "Sales Invoices", href: "/sales/invoices" },
        { label: "Quotation / Estimate", href: "/sales/quotations" },
        { label: "Payment In", href: "/sales/payment-in" },
        { label: "Sales Return", href: "/sales/returns" },
        { label: "Credit Note", href: "/sales/credit-notes" },
      ],
    },
    {
      icon: UserCheck,
      label: "Staff Attendance & Payroll",
      href: "/staff-attendance",
    },
    {
      icon: ShoppingCart,
      label: "Purchases",
      href: "/purchases",
      subItems: [
        { label: "Purchase Invoices", href: "/purchases/invoices" },
        { label: "Payment Out", href: "/purchases/payment-out" },
        { label: "Purchase Return", href: "/purchases/returns" },
        { label: "Debit Note", href: "/purchases/debit-notes" },
        { label: "Purchase Orders", href: "/purchases/orders" },
      ],
    },
    { icon: FileText, label: "Reports", href: "/reports" },
    { icon: Wallet, label: "Expenses", href: "/expenses" },
    { icon: Building2, label: "Branch Management", href: "/branches" },
  ];

  const isLoggedIn = localStorage.getItem("isLoggedIn") === "true";
  let currentUser = null;
  try {
    currentUser = JSON.parse(localStorage.getItem("currentUser") || "null");
  } catch (error) {
    console.error("Invalid currentUser data", error);
    localStorage.removeItem("currentUser");
  }

  let allowedMenus = [
    "Dashboard",
    "Cash & Bank",
    "Parties",
    "Items",
    "Sales",
    "Reports",
    "Staff Attendance & Payroll",
    "Purchases",
    "Expenses",
    "Branch Management",
  ];

  if (isLoggedIn && currentUser && currentUser.permissions) {
    // If permissions is an array of objects (Branch structure), extract the module names
    if (currentUser.permissions.length > 0 && typeof currentUser.permissions[0] === 'object') {
      // Filter out modules where view is explicitly set to false
      allowedMenus = currentUser.permissions
        .filter(p => p.actions?.view !== false)
        .map(p => p.module);
    } else {
      // Otherwise assume it's already an array of strings
      allowedMenus = currentUser.permissions;
    }

    // Always ensure Reports is allowed if not already present (optional per previous logic)
    if (!allowedMenus.includes("Reports")) {
      allowedMenus = [...allowedMenus, "Reports"];
    }
  }

  const filteredMenuItems = menuItems.filter((item) =>
    allowedMenus.includes(item.label)
  );

  return (
    <>
      {/* Mobile Menu Button */}
      {!isMobileMenuOpen && (
        <button
          onClick={toggleMobileMenu}
          className="lg:hidden fixed top-4 left-4 z-50 p-2.5 bg-black text-white rounded-xl shadow-lg hover:scale-105 active:scale-95 transition-all"
        >
          <Menu size={20} />
        </button>
      )}

      {/* Mobile Overlay */}
      {isMobileMenuOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-40 transition-all duration-300"
          onClick={closeMobileMenu}
        />
      )}

      {/* Sidebar */}
      <div
        className={cn(
          "fixed left-0 top-0 h-screen bg-white flex flex-col shadow-2xl z-40 overflow-y-auto custom-scrollbar border-r border-gray-100 transition-all duration-300 w-64",
          isMobileMenuOpen
            ? "translate-x-0"
            : "-translate-x-full lg:translate-x-0"
        )}
      >
        {/* Header with Logo - Updated Premium Design */}
        <div className="flex justify-between items-center px-6 py-3 border-b border-gray-100 bg-gradient-to-b from-white to-gray-50/50">
          <div className="flex items-center gap-3.5 group cursor-pointer">
            <div className="flex flex-col">
              <span className="text-gray-900 text-2xl font-black tracking-tight leading-none font-sans group-hover:text-black transition-colors">
                Faizan
              </span>
              <span className="text-[#b4933d] text-[10px] font-bold uppercase tracking-[2.5px] mt-0.5 group-hover:tracking-[3px] transition-all duration-300">
                Aquaculture
              </span>
            </div>
          </div>

          <button
            onClick={closeMobileMenu}
            className="lg:hidden p-2 text-gray-400 hover:text-gray-900 transition-colors rounded-lg hover:bg-gray-100"
          >
            <X size={20} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-8">
          <div className="space-y-1.5">
            {filteredMenuItems.map((item) => (
              <SidebarItem
                key={item.label}
                {...item}
                active={
                  currentPath === item.href ||
                  (item.href === "/sales" &&
                    currentPath.startsWith("/sales")) ||
                  (item.href === "/items" &&
                    currentPath.startsWith("/items")) ||
                  (item.href === "/purchases" &&
                    currentPath.startsWith("/purchases")) ||
                  (item.href === "/branches" &&
                    currentPath.startsWith("/branches")) ||
                  (item.href === "/reports" &&
                    currentPath.startsWith("/reports"))
                }
                onClick={closeMobileMenu}
              />
            ))}
          </div>
        </nav>

        {/* User / Logout Section */}
        <div className="p-4 mt-auto"> 
          <button
            onClick={handleLogout}
            className="flex items-center justify-center  bg-red-100 gap-3 px-4 py-3 rounded-xl transition-all duration-300 text-red-500 hover:bg-red-50 hover:text-red-500 w-full group font-bold text-sm tracking-wide"
          >
            <LogOut
              size={18}
              className="shrink-0 transition-transform group-hover:-translate-x-1"
            />
            Logout
          </button>
        </div>
      </div>
    </>
  );
};

export default Sidebar;
