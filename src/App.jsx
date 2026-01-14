import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import Parties from './pages/Parties';
import AddParty from './pages/AddParty';
import EditParty from './pages/EditParty';
import ViewParty from './pages/ViewParty';
import CashBank from './pages/CashBank';
import AddCashBank from './pages/AddCashBank';
import ViewAccount from './pages/ViewAccount';
import EditAccount from './pages/EditAccount';
import Invoices from './pages/Invoices';
import AddInvoice from './pages/AddInvoice';
import ViewInvoice from './pages/ViewInvoice';
import EditInvoice from './pages/EditInvoice';
import InvoicePDF from './pages/InvoicePDF';
import InvoicePayment from './pages/InvoicePayment';
import StaffAttendance from './pages/StaffAttendance';
import AddEmployee from './pages/AddEmployee';
import ViewEmployee from './pages/ViewEmployee';
import EditEmployee from './pages/EditEmployee';
import Login from './pages/Login';
import Profile from './pages/Profile';
import Inventory from './pages/Inventory';
import Godown from './pages/Godown';
import SalesInvoices from './pages/SalesInvoices';
import Quotations from './pages/Quotations';
import PaymentIn from './pages/PaymentIn';
import SalesReturn from './pages/SalesReturn';
import CreditNote from './pages/CreditNote';
import PurchaseInvoices from './pages/PurchaseInvoices';
import PaymentOut from './pages/PaymentOut';
import PurchaseReturn from './pages/PurchaseReturn';
import DebitNote from './pages/DebitNote';
import ViewDebitNote from './pages/ViewDebitNote';
import PurchaseOrders from './pages/PurchaseOrders';
import SalesPlaceholder from './pages/SalesPlaceholder';
import ProtectedRoute from './components/auth/ProtectedRoute';
import Branches from './pages/Branches';
import CreateBranch from './pages/CreateBranch';
import ViewBranch from './pages/ViewBranch';
import AddQuotation from './pages/AddQuotation';
import EditQuotation from './pages/EditQuotation';
import ViewQuotation from './pages/ViewQuotation';
import AddPaymentIn from './pages/AddPaymentIn';
import ViewPaymentIn from './pages/ViewPaymentIn';
import EditPaymentIn from './pages/EditPaymentIn';
import AddSalesReturn from './pages/AddSalesReturn';
import EditSalesReturn from './pages/EditSalesReturn';
import ViewSalesReturn from './pages/ViewSalesReturn';
import AddCreditNote from './pages/AddCreditNote';
import EditCreditNote from './pages/EditCreditNote';
import ViewCreditNote from './pages/ViewCreditNote';
import AddPurchaseInvoice from './pages/AddPurchaseInvoice';
import ViewPurchaseInvoice from './pages/ViewPurchaseInvoice';
import AddPaymentOut from './pages/AddPaymentOut';
import ViewPaymentOut from './pages/ViewPaymentOut';
import EditPaymentOut from './pages/EditPaymentOut';
import AddPurchaseReturn from './pages/AddPurchaseReturn';
import ViewPurchaseReturn from './pages/ViewPurchaseReturn';
import AddDebitNote from './pages/AddDebitNote';
import AddPurchaseOrder from './pages/AddPurchaseOrder';
import ViewPurchaseOrder from './pages/ViewPurchaseOrder';
import Reports from './pages/Reports';
import BalanceSheet from './pages/BalanceSheet';
import DynamicReport from './pages/DynamicReport';
import Expenses from './pages/Expenses';
import AddExpense from './pages/AddExpense';
import ExpensePDF from './pages/ExpensePDF';
import Daybook from './pages/Daybook';


function App() {
  return (
    <Router>
        <Routes>
            <Route path="/login" element={<Login />} />
            
            <Route path="/" element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            } />

            {/* Items Module */}
            <Route path="/items" element={<Navigate to="/items/inventory" replace />} />
            <Route path="/items/inventory" element={
              <ProtectedRoute>
                <Inventory />
              </ProtectedRoute>
            } />
            <Route path="/items/godown" element={
              <ProtectedRoute>
                <Godown />
              </ProtectedRoute>
            } />

            {/* Sales Module */}
            <Route path="/sales" element={<Navigate to="/sales/invoices" replace />} />
            <Route path="/sales/invoices" element={
              <ProtectedRoute>
                <SalesInvoices />
              </ProtectedRoute>
            } />
            <Route path="/sales/quotations" element={
              <ProtectedRoute>
                <Quotations />
              </ProtectedRoute>
            } />
            <Route path="/add-quotation" element={
              <ProtectedRoute>
                <AddQuotation />
              </ProtectedRoute>
            } />
            <Route path="/edit-quotation/:id" element={
              <ProtectedRoute>
                <EditQuotation />
              </ProtectedRoute>
            } />
            <Route path="/view-quotation/:id" element={
              <ProtectedRoute>
                <ViewQuotation />
              </ProtectedRoute>
            } />
            <Route path="/sales/payment-in" element={
              <ProtectedRoute>
                <PaymentIn />
              </ProtectedRoute>
            } />
            <Route path="/sales/payment-in/add" element={
              <ProtectedRoute>
                <AddPaymentIn />
              </ProtectedRoute>
            } />
            <Route path="/sales/payment-in/view/:id" element={
              <ProtectedRoute>
                <ViewPaymentIn />
              </ProtectedRoute>
            } />
            <Route path="/sales/payment-in/edit/:id" element={
              <ProtectedRoute>
                <EditPaymentIn />
              </ProtectedRoute>
            } />
            <Route path="/sales/returns" element={
              <ProtectedRoute>
                <SalesReturn />
              </ProtectedRoute>
            } />
            <Route path="/add-sales-return" element={
              <ProtectedRoute>
                <AddSalesReturn />
              </ProtectedRoute>
            } />
            <Route path="/sales/return/view/:id" element={
              <ProtectedRoute>
                <ViewSalesReturn />
              </ProtectedRoute>
            } />
            <Route path="/sales/return/edit/:id" element={
              <ProtectedRoute>
                <EditSalesReturn />
              </ProtectedRoute>
            } />
            <Route path="/sales/credit-notes" element={
              <ProtectedRoute>
                <CreditNote />
              </ProtectedRoute>
            } />
            <Route path="/add-credit-note" element={
              <ProtectedRoute>
                <AddCreditNote />
              </ProtectedRoute>
            } />
            <Route path="/sales/credit-note/view/:id" element={
              <ProtectedRoute>
                <ViewCreditNote />
              </ProtectedRoute>
            } />
            <Route path="/sales/credit-note/edit/:id" element={
              <ProtectedRoute>
                <EditCreditNote />
              </ProtectedRoute>
            } />
            <Route path="/sales/delivery-challans" element={
              <ProtectedRoute>
                <SalesPlaceholder title="Delivery Challan" />
              </ProtectedRoute>
            } />
            <Route path="/sales/proforma-invoices" element={
              <ProtectedRoute>
                <SalesPlaceholder title="Proforma Invoice" />
              </ProtectedRoute>
            } />

            {/* Purchases Module */}
            <Route path="/purchases" element={<Navigate to="/purchases/invoices" replace />} />
            <Route path="/purchases/invoices" element={
              <ProtectedRoute>
                <PurchaseInvoices />
              </ProtectedRoute>
            } />
            <Route path="/add-purchase-invoice" element={
              <ProtectedRoute>
                <AddPurchaseInvoice />
              </ProtectedRoute>
            } />
            <Route path="/purchases/edit/:id" element={
              <ProtectedRoute>
                <AddPurchaseInvoice />
              </ProtectedRoute>
            } />
            <Route path="/purchases/view/:id" element={
              <ProtectedRoute>
                <ViewPurchaseInvoice />
              </ProtectedRoute>
            } />
            <Route path="/purchases/payment-out" element={
              <ProtectedRoute>
                <PaymentOut />
              </ProtectedRoute>
            } />
            <Route path="/add-payment-out" element={
              <ProtectedRoute>
                <AddPaymentOut />
              </ProtectedRoute>
            } />
            <Route path="/purchases/view-payment-out/:id" element={
              <ProtectedRoute>
                <ViewPaymentOut />
              </ProtectedRoute>
            } />
            <Route path="/purchases/edit-payment-out/:id" element={
              <ProtectedRoute>
                <EditPaymentOut />
              </ProtectedRoute>
            } />
            <Route path="/purchases/returns" element={
              <ProtectedRoute>
                <PurchaseReturn />
              </ProtectedRoute>
            } />
            <Route path="/add-purchase-return" element={
              <ProtectedRoute>
                <AddPurchaseReturn />
              </ProtectedRoute>
            } />
            <Route path="/purchases/return/view/:id" element={
              <ProtectedRoute>
                <ViewPurchaseReturn />
              </ProtectedRoute>
            } />
            <Route path="/purchases/return/edit/:id" element={
              <ProtectedRoute>
                <AddPurchaseReturn />
              </ProtectedRoute>
            } />
            <Route path="/purchases/debit-notes" element={
              <ProtectedRoute>
                <DebitNote />
              </ProtectedRoute>
            } />
            <Route path="/add-debit-note" element={
              <ProtectedRoute>
                <AddDebitNote />
              </ProtectedRoute>
            } />
            <Route path="/purchases/debit-note/view/:id" element={
              <ProtectedRoute>
                <ViewDebitNote />
              </ProtectedRoute>
            } />
            <Route path="/purchases/debit-note/edit/:id" element={
              <ProtectedRoute>
                <AddDebitNote />
              </ProtectedRoute>
            } />
            <Route path="/purchases/orders" element={
              <ProtectedRoute>
                <PurchaseOrders />
              </ProtectedRoute>
            } />
            <Route path="/add-purchase-order" element={
              <ProtectedRoute>
                <AddPurchaseOrder />
              </ProtectedRoute>
            } />
            <Route path="/purchases/order/view/:id" element={
              <ProtectedRoute>
                <ViewPurchaseOrder />
              </ProtectedRoute>
            } />
            <Route path="/purchases/order/edit/:id" element={
              <ProtectedRoute>
                <AddPurchaseOrder />
              </ProtectedRoute>
            } />

            {/* Parties Module */}
            <Route path="/parties" element={
              <ProtectedRoute>
                <Parties />
              </ProtectedRoute>
            } />
            <Route path="/add-party" element={
              <ProtectedRoute>
                <AddParty />
              </ProtectedRoute>
            } />
            <Route path="/edit-party/:id" element={
              <ProtectedRoute>
                <EditParty />
              </ProtectedRoute>
            } />
            <Route path="/view-party/:id" element={
              <ProtectedRoute>
                <ViewParty />
              </ProtectedRoute>
            } />

            {/* Cash & Bank Module */}
            <Route path="/cash-bank" element={
              <ProtectedRoute>
                <CashBank />
              </ProtectedRoute>
            } />
            <Route path="/add-cash-bank" element={
              <ProtectedRoute>
                <AddCashBank />
              </ProtectedRoute>
            } />
            <Route path="/view-account/:id" element={
              <ProtectedRoute>
                <ViewAccount />
              </ProtectedRoute>
            } />
            <Route path="/edit-account/:id" element={
              <ProtectedRoute>
                <EditAccount />
              </ProtectedRoute>
            } />

            {/* Invoices Module */}
            <Route path="/invoices" element={
              <ProtectedRoute>
                <Invoices />
              </ProtectedRoute>
            } />
            <Route path="/add-invoice" element={
              <ProtectedRoute>
                <AddInvoice />
              </ProtectedRoute>
            } />
            <Route path="/view-invoice/:id" element={
              <ProtectedRoute>
                <ViewInvoice />
              </ProtectedRoute>
            } />
            <Route path="/edit-invoice/:id" element={
              <ProtectedRoute>
                <EditInvoice />
              </ProtectedRoute>
            } />
            <Route path="/invoice-pdf/:id" element={
              <ProtectedRoute>
                <InvoicePDF />
              </ProtectedRoute>
            } />
            <Route path="/invoice-payment/:id" element={
              <ProtectedRoute>
                <InvoicePayment />
              </ProtectedRoute>
            } />

            {/* Staff Attendance & Payroll Module */}
            <Route path="/staff-attendance" element={
              <ProtectedRoute>
                <StaffAttendance />
              </ProtectedRoute>
            } />

            {/* Expenses Module */}
            <Route path="/expenses" element={
              <ProtectedRoute>
                <Expenses />
              </ProtectedRoute>
            } />
            <Route path="/add-expense" element={
              <ProtectedRoute>
                <AddExpense />
              </ProtectedRoute>
            } />
            <Route path="/expenses/edit/:id" element={
              <ProtectedRoute>
                <AddExpense />
              </ProtectedRoute>
            } />
            <Route path="/expenses/print/:id" element={
              <ProtectedRoute>
                <ExpensePDF />
              </ProtectedRoute>
            } />


            {/* Other */}
            <Route path="/profile" element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            } />

            {/* Branch Management */}
            <Route path="/branches" element={
              <ProtectedRoute>
                <Branches />
              </ProtectedRoute>
            } />
            <Route path="/branches/create" element={
              <ProtectedRoute>
                <CreateBranch />
              </ProtectedRoute>
            } />

            {/* Reports Module */}
            <Route path="/reports" element={
              <ProtectedRoute>
                <Reports />
              </ProtectedRoute>
            } />
            <Route path="/daybook" element={
              <ProtectedRoute>
                <Daybook />
              </ProtectedRoute>
            } />
            <Route path="/reports/balance-sheet" element={
              <ProtectedRoute>
                <BalanceSheet />
              </ProtectedRoute>
            } />
            <Route path="/reports/:reportType" element={
              <ProtectedRoute>
                <DynamicReport />
              </ProtectedRoute>
            } />

            {/* Branch Management Routes */}
            <Route path="/branches" element={
              <ProtectedRoute>
                <Branches />
              </ProtectedRoute>
            } />
            <Route path="/branches/create" element={
              <ProtectedRoute>
                <CreateBranch />
              </ProtectedRoute>
            } />
            <Route path="/branches/view/:id" element={
              <ProtectedRoute>
                <ViewBranch />
              </ProtectedRoute>
            } />
            <Route path="/branches/edit/:id" element={
              <ProtectedRoute>
                <CreateBranch />
              </ProtectedRoute>
            } />

            
            <Route path="*" element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            } />
        </Routes>
    </Router>
  )
}

export default App
