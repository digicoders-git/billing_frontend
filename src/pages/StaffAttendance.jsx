import React, { useState, useEffect, useCallback } from 'react';
import DashboardLayout from '../components/layout/DashboardLayout';
import { 
    Plus, X, Phone, User, IndianRupee, 
    Calendar, AlertCircle, ChevronDown, CheckCircle2, Trash2, Clock, MapPin, History, MoreVertical
} from 'lucide-react';
import api from '../lib/axios';
import Swal from 'sweetalert2';

const StaffAttendance = () => {
    const [showAddStaffModal, setShowAddStaffModal] = useState(false);
    const [showAttendanceModal, setShowAttendanceModal] = useState(false);
    const [showHistoryModal, setShowHistoryModal] = useState(false);
    
    const [staffList, setStaffList] = useState([]);
    const [selectedStaff, setSelectedStaff] = useState(null);
    const [staffHistory, setStaffHistory] = useState([]);
    const [attendanceDate, setAttendanceDate] = useState(new Date().toISOString().split('T')[0]); // Today YYYY-MM-DD
    
    // Form for Adding Staff
    const [staffForm, setStaffForm] = useState({
        name: '',
        mobile: '',
        salaryType: 'Monthly',
        salary: '',
        salaryCycle: '10 to 10 Every month',
        openingBalance: '0',
        balanceType: 'To Pay'
    });

    // Form for Marking Attendance
    const [attendanceForm, setAttendanceForm] = useState({
        status: 'Present',
        inTime: '',
        outTime: '',
        note: ''
    });

    const fetchStaffAndAttendance = useCallback(async () => {
        try {
            const today = new Date().toISOString().split('T')[0];
            const attendanceRes = await api.get(`/attendance/daily?date=${today}`);
            
            if (attendanceRes.status === 200 || attendanceRes.status === 201) {
                 setStaffList(attendanceRes.data);
            }
        } catch (error) {
            console.error("Failed to fetch staff data", error);
            // Don't show alert on auto-fetch to avoid spamming user
        }
    }, []);

    useEffect(() => {
        fetchStaffAndAttendance();
    }, [fetchStaffAndAttendance]);

    const handleAddStaffSubmit = async (e) => {
        e.preventDefault();
        try {
            await api.post('/staff', staffForm);
            Swal.fire({
                title: 'Success', 
                text: 'Staff Member Added Successfully', 
                icon: 'success',
                timer: 2000,
                showConfirmButton: false
            });
            setShowAddStaffModal(false);
            setStaffForm({
                name: '',
                mobile: '',
                salaryType: 'Monthly',
                salary: '',
                salaryCycle: '10 to 10 Every month',
                openingBalance: '0',
                balanceType: 'To Pay'
            });
            fetchStaffAndAttendance();
        } catch (error) {
            console.error("Error adding staff", error);
            Swal.fire('Error', 'Failed to add staff', 'error');
        }
    };

    const handleDelete = async (id, name) => {
         const result = await Swal.fire({
              title: 'Delete Staff?',
              text: `Are you sure you want to delete ${name}? All attendance history will strictly remain, but the staff member will be removed from this list.`,
              icon: 'warning',
              showCancelButton: true,
              confirmButtonColor: '#ef4444',
              cancelButtonColor: '#cbd5e1',
              confirmButtonText: 'Yes, delete!',
              cancelButtonText: 'Cancel'
            });
        
            if (result.isConfirmed) {
              try {
                await api.delete(`/staff/${id}`);
                setStaffList(prev => prev.filter(p => p._id !== id));
                Swal.fire({
                    title: 'Deleted!',
                    text: 'Staff record has been deleted.',
                    icon: 'success',
                    timer: 1500,
                    showConfirmButton: false
                });
              } catch (error) {
                console.error('Error deleting staff:', error);
                Swal.fire('Error', 'Failed to delete staff', 'error');
              }
            }
    }

    const openAttendanceModal = (staff) => {
        setSelectedStaff(staff);
        // Pre-fill form if attendance exists
        if (staff.attendance) {
            setAttendanceForm({
                status: staff.attendance.status,
                inTime: staff.attendance.inTime || '',
                outTime: staff.attendance.outTime || '',
                note: staff.attendance.note || ''
            });
        } else {
             setAttendanceForm({
                status: 'Present',
                inTime: new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }),
                outTime: '',
                note: ''
            });
        }
        setShowAttendanceModal(true);
    };

    const openHistoryModal = async (staff) => {
        setSelectedStaff(staff);
        setShowHistoryModal(true);
        try {
            const currentMonth = new Date().getMonth() + 1;
            const currentYear = new Date().getFullYear();
            const res = await api.get(`/attendance/${staff._id}?month=${currentMonth}&year=${currentYear}`);
            setStaffHistory(res.data);
        } catch (error) {
            console.error("Failed to fetch history", error);
        }
    };

    const handleAttendanceSubmit = async (e) => {
        e.preventDefault();
        try {
            console.log("Submitting Attendance:", {
                staffId: selectedStaff._id,
                date: attendanceDate,
                ...attendanceForm
            });
            
            const res = await api.post('/attendance', {
                staffId: selectedStaff._id,
                date: attendanceDate,
                ...attendanceForm
            });
            console.log("Attendance Response:", res.data);

            Swal.fire({
                title: 'Marked!',
                text: 'Attendance Updated Successfully',
                icon: 'success',
                timer: 1500,
                showConfirmButton: false
            });
            setShowAttendanceModal(false);
            fetchStaffAndAttendance(); // Refresh to show new status
        } catch (error) {
            console.error("Error marking attendance", error);
            const errMsg = error.response?.data?.message || 'Failed to update attendance';
            Swal.fire('Error', errMsg, 'error');
        }
    };

    // Helper functions for formatting
    const getStatusColor = (status) => {
        switch(status) {
            case 'Present': return 'bg-green-100 text-green-700 border-green-200';
            case 'Absent': return 'bg-red-100 text-red-700 border-red-200';
            case 'Half Day': return 'bg-orange-100 text-orange-700 border-orange-200';
            default: return 'bg-gray-100 text-gray-500 border-gray-200';
        }
    };

    return (
        <DashboardLayout>
            <div className="min-h-[calc(100vh-120px)] flex flex-col">
                {/* Header */}
                <div className="mb-8 flex flex-col md:flex-row md:justify-between md:items-center gap-4">
                    <div>
                         <h1 className="text-2xl font-bold text-gray-800">Staff Attendance & Payroll</h1>
                         <p className="text-gray-500 mt-1 flex items-center gap-2">
                            <Calendar size={16} />
                            {new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                         </p>
                    </div>
                   
                    <button 
                        onClick={() => setShowAddStaffModal(true)}
                        className="flex items-center gap-2 bg-black text-white px-6 py-3 rounded-xl font-bold hover:bg-gray-800 transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5"
                    >
                        <Plus size={20} /> Add New Staff
                    </button>
                </div>

                {staffList.length === 0 ? (
                    /* Empty State */
                    <div className="flex-1 flex flex-col items-center justify-center text-center pb-20 animate-fade-in">
                         <div className="bg-gray-50 p-8 rounded-full mb-6 relative">
                            <div className="absolute inset-0 bg-blue-100/50 rounded-full animate-pulse"></div>
                            <User size={64} className="text-blue-500 relative z-10" />
                         </div>
                        <h2 className="text-2xl font-bold text-gray-800 mb-3">No Staff Members Found</h2>
                        <p className="text-gray-500 font-medium mb-8 max-w-md">Get started by adding your staff members to manage their daily attendance, calculate salaries, and track advances.</p>
                        <button 
                            onClick={() => setShowAddStaffModal(true)}
                            className="text-blue-600 font-bold hover:underline"
                        >
                            + Add your first staff member
                        </button>
                    </div>
                ) : (
                    /* Staff List Grid */
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fade-in">
                        {staffList.map((staff) => (
                            <div key={staff._id} className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-300 group relative overflow-hidden flex flex-col">
                                {/* Top colored bar based on status */}
                                <div className={`h-1.5 w-full ${staff.attendance ? (staff.attendance.status === 'Present' ? 'bg-green-500' : staff.attendance.status === 'Absent' ? 'bg-red-500' : 'bg-orange-500') : 'bg-gray-200'}`}></div>
                                
                                <div className="p-6 flex-1">
                                    <div className="flex justify-between items-start mb-6">
                                        <div className="flex items-center gap-4">
                                            <div className="w-14 h-14 bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl flex items-center justify-center text-gray-700 font-bold text-xl uppercase shadow-inner">
                                                {staff.name.charAt(0)}
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-lg text-gray-900 leading-tight">{staff.name}</h3>
                                                <div className="flex items-center gap-1.5 text-sm text-gray-500 mt-1 font-medium">
                                                    <Phone size={12} />
                                                    {staff.mobile}
                                                </div>
                                            </div>
                                        </div>
                                        
                                        <div className="relative z-10">
                                            <button 
                                                onClick={() => handleDelete(staff._id, staff.name)}
                                                className="w-8 h-8 rounded-full bg-white border border-gray-200 flex items-center justify-center text-gray-400 hover:text-red-500 hover:border-red-200 hover:bg-red-50 transition-all opacity-0 group-hover:opacity-100"
                                                title="Delete Staff"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </div>

                                    {/* Attendance Status Pill */}
                                    <div className="flex items-center justify-between mb-6 bg-gray-50 p-3 rounded-xl">
                                        <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Today's Status</span>
                                        {staff.attendance ? (
                                             <div className={`flex items-center gap-1.5 px-3 py-1 rounded-lg border ${getStatusColor(staff.attendance.status)}`}>
                                                {staff.attendance.status === 'Present' ? <CheckCircle2 size={14} /> : <AlertCircle size={14} />}
                                                <span className="text-xs font-bold uppercase">{staff.attendance.status}</span>
                                             </div>
                                        ) : (
                                             <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg border border-gray-200 bg-white text-gray-400">
                                                <Clock size={14} />
                                                <span className="text-xs font-bold uppercase">Not Marked</span>
                                             </div>
                                        )}
                                    </div>
                                    
                                    {/* Stats Grid */}
                                    <div className="grid grid-cols-2 gap-4 mb-2">
                                        <div className="p-3 bg-indigo-50/50 rounded-xl border border-indigo-100/50 hover:bg-indigo-50 transition-colors">
                                            <p className="text-xs text-indigo-400 font-bold uppercase mb-1">Salary</p>
                                            <p className="font-bold text-gray-900">₹{staff.salary}</p>
                                            <p className="text-[10px] text-gray-400">{staff.salaryType}</p>
                                        </div>
                                        <div className={`p-3 rounded-xl border transition-colors ${staff.balanceType === 'To Pay' ? 'bg-red-50/50 border-red-100/50 hover:bg-red-50' : 'bg-green-50/50 border-green-100/50 hover:bg-green-50'}`}>
                                            <p className={`text-xs font-bold uppercase mb-1 ${staff.balanceType === 'To Pay' ? 'text-red-400' : 'text-green-500'}`}>Balance</p>
                                            <p className={`font-bold ${staff.balanceType === 'To Pay' ? 'text-red-600' : 'text-green-700'}`}>₹{staff.openingBalance}</p>
                                            <p className={`text-[10px] ${staff.balanceType === 'To Pay' ? 'text-red-300' : 'text-green-300'}`}>{staff.balanceType}</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Action Buttons */}
                                <div className="p-4 border-t border-gray-100 bg-gray-50/30 flex gap-3">
                                    <button 
                                        onClick={() => openAttendanceModal(staff)}
                                        className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all shadow-sm flex items-center justify-center gap-2
                                            ${staff.attendance 
                                                ? 'bg-white border border-indigo-200 text-indigo-600 hover:bg-indigo-50' 
                                                : 'bg-[#000000] text-white hover:bg-indigo-700 hover:shadow-indigo-300'}`}
                                    >
                                        {staff.attendance ? 'Edit Status' : 'Mark Present'}
                                    </button>
                                    <button 
                                        onClick={() => openHistoryModal(staff)}
                                        className="px-4 py-2.5 bg-white border border-gray-200 text-gray-600 rounded-xl hover:bg-gray-100 hover:text-gray-900 transition-colors"
                                        title="View History"
                                    >
                                        <History size={20} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Add Staff Modal */}
            {showAddStaffModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden animate-scale-up border border-gray-100">
                        <div className="bg-gray-50 px-8 py-6 border-b border-gray-100 flex justify-between items-center">
                            <div>
                                <h2 className="text-xl font-bold text-gray-900">Add New Staff Member</h2>
                                <p className="text-sm text-gray-500">Enter employee details for payroll & attendance</p>
                            </div>
                            <button onClick={() => setShowAddStaffModal(false)} className="text-gray-400 hover:text-gray-600 transition-colors bg-white p-2 rounded-lg border border-gray-200 hover:bg-gray-100">
                                <X size={20} />
                            </button>
                        </div>
                        <form onSubmit={handleAddStaffSubmit} className="p-8">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6 mb-8">
                                {/* Name */}
                                <div className="space-y-1.5">
                                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider">Full Name <span className="text-red-500">*</span></label>
                                    <input 
                                        type="text" 
                                        required
                                        value={staffForm.name}
                                        onChange={(e) => setStaffForm(prev => ({ ...prev, name: e.target.value }))}
                                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-black/5 focus:border-black transition-all outline-none text-gray-800 font-medium placeholder:text-gray-400"
                                        placeholder="e.g. Rahul Sharma"
                                    />
                                </div>

                                {/* Mobile */}
                                <div className="space-y-1.5">
                                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider">Mobile Number <span className="text-red-500">*</span></label>
                                    <div className="relative">
                                        <input 
                                            type="tel" 
                                            required
                                            value={staffForm.mobile}
                                            onChange={(e) => setStaffForm(prev => ({ ...prev, mobile: e.target.value }))}
                                            className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-black/5 focus:border-black transition-all outline-none text-gray-800 font-medium"
                                            placeholder="9876543210"
                                        />
                                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-sm">+91</span>
                                    </div>
                                </div>

                                {/* Salary Payout Type */}
                                <div className="space-y-1.5">
                                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider">Payment Structure <span className="text-red-500">*</span></label>
                                    <div className="relative">
                                        <select 
                                            required
                                            value={staffForm.salaryType}
                                            onChange={(e) => setStaffForm(prev => ({ ...prev, salaryType: e.target.value }))}
                                            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-black/5 focus:border-black transition-all outline-none appearance-none text-gray-800 font-medium cursor-pointer"
                                        >
                                            <option>Monthly</option>
                                            <option>Daily (Wage)</option>
                                            <option>Weekly</option>
                                        </select>
                                        <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={16} />
                                    </div>
                                </div>

                                {/* Salary */}
                                <div className="space-y-1.5">
                                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider">Base Salary <span className="text-red-500">*</span></label>
                                    <div className="relative">
                                        <input 
                                            type="number" 
                                            required
                                            value={staffForm.salary}
                                            onChange={(e) => setStaffForm(prev => ({ ...prev, salary: e.target.value }))}
                                            className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-black/5 focus:border-black transition-all outline-none text-gray-800 font-medium placeholder:text-gray-400"
                                            placeholder="20000"
                                        />
                                        <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                                    </div>
                                </div>

                                {/* Opening Balance */}
                                <div className="space-y-1.5 col-span-1 md:col-span-2">
                                    <div className="flex items-center gap-2 mb-1">
                                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider">Opening Balance</label>
                                        <div className="group relative">
                                            <AlertCircle size={14} className="text-gray-400 cursor-help" />
                                            <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-2 bg-gray-800 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">Previous dues or advances</span>
                                        </div>
                                    </div>
                                    <div className="flex bg-gray-50 rounded-xl border border-gray-200 overflow-hidden focus-within:ring-2 focus-within:ring-black/5 focus-within:border-black transition-all">
                                        <div className="relative flex-1">
                                            <input 
                                                type="number" 
                                                value={staffForm.openingBalance}
                                                onChange={(e) => setStaffForm(prev => ({ ...prev, openingBalance: e.target.value }))}
                                                className="w-full pl-10 pr-4 py-3 bg-transparent border-none focus:ring-0 outline-none text-gray-900 font-medium"
                                                placeholder="0"
                                            />
                                            <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                                        </div>
                                        <div className="w-px bg-gray-200"></div>
                                        <div className="relative w-40">
                                            <select 
                                                value={staffForm.balanceType}
                                                onChange={(e) => setStaffForm(prev => ({ ...prev, balanceType: e.target.value }))}
                                                className="w-full h-full px-4 py-2 bg-white/50 border-none outline-none appearance-none text-gray-700 font-bold cursor-pointer text-sm"
                                            >
                                                <option value="To Pay">Required To Pay</option>
                                                <option value="To Collect">Advance Given</option>
                                            </select>
                                            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={14} />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center justify-end gap-3 pt-6 border-t border-gray-100">
                                <button 
                                    type="button"
                                    onClick={() => setShowAddStaffModal(false)}
                                    className="px-6 py-2.5 bg-white border border-gray-300 text-gray-700 rounded-xl font-bold hover:bg-gray-50 transition-all text-sm"
                                >
                                    Cancel
                                </button>
                                <button 
                                    type="submit"
                                    className="px-8 py-2.5 bg-black text-white rounded-xl font-bold hover:bg-gray-900 transition-all text-sm shadow-lg hover:shadow-black/20 hover:-translate-y-0.5"
                                >
                                    Save Staff
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Attendance Modal (Updated Design) */}
            {showAttendanceModal && selectedStaff && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-scale-up border border-gray-100">
                        <div className="bg-[#000000] p-6 text-white text-center relative overflow-hidden">
                            <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
                            <h2 className="text-2xl font-bold relative z-10">{selectedStaff.name}</h2>
                            <p className="text-indigo-100 text-sm relative z-10">Marking attendance for today</p>
                            <button 
                                onClick={() => setShowAttendanceModal(false)} 
                                className="absolute top-4 right-4 z-20 p-2 bg-white/10 hover:bg-white/20 rounded-lg text-white hover:text-white transition-all border border-white/20 hover:border-white/40"
                            >
                                <X size={20} />
                            </button>
                        </div>
                        
                        <form onSubmit={handleAttendanceSubmit} className="p-6">
                            <div className="space-y-6">
                                {/* Date Display */}
                                <div className="bg-indigo-50 p-3 rounded-xl flex items-center justify-center text-indigo-900 font-bold text-sm border border-indigo-100">
                                    <Calendar className="mr-2 text-indigo-500" size={16} />
                                    {new Date(attendanceDate).toDateString()}
                                </div>

                                {/* Status Toggle */}
                                <div className="space-y-3">
                                     <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider text-center">Select Status</label>
                                     <div className="grid grid-cols-3 gap-3">
                                         {['Present', 'Absent', 'Half Day'].map(status => (
                                            <button
                                                key={status}
                                                type="button"
                                                onClick={() => {
                                                    console.log("Status clicked:", status);
                                                    setAttendanceForm(prev => ({ ...prev, status }));
                                                }}
                                                className={`py-3 rounded-xl text-sm font-bold border-2 transition-all duration-200 cursor-pointer
                                                    ${attendanceForm.status === status 
                                                        ? (status === 'Present' ? 'bg-green-100 border-green-500 text-green-700' : 
                                                           status === 'Absent' ? 'bg-red-100 border-red-500 text-red-700' : 'bg-orange-100 border-orange-500 text-orange-700') 
                                                        : 'bg-white border-gray-100 text-gray-500 hover:border-gray-300'
                                                    }`}
                                             >
                                                 {status}
                                             </button>
                                         ))}
                                     </div>
                                </div>
                                
                                {/* Time In / Time Out */}
                                <div className={`grid grid-cols-2 gap-4 transition-all duration-300 ${attendanceForm.status === 'Absent' ? 'opacity-50 pointer-events-none grayscale' : 'opacity-100'}`}>
                                     <div className="space-y-1.5">
                                         <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider">In Time</label>
                                         <div className="relative">
                                            <input 
                                                type="time" 
                                                value={attendanceForm.inTime} 
                                                onChange={(e) => setAttendanceForm(prev => ({...prev, inTime: e.target.value}))}
                                                className="w-full pl-9 pr-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-bold text-gray-700"
                                            />
                                            <Clock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                                         </div>
                                     </div>
                                      <div className="space-y-1.5">
                                         <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider">Out Time</label>
                                         <div className="relative">
                                            <input 
                                                type="time" 
                                                value={attendanceForm.outTime} 
                                                onChange={(e) => setAttendanceForm(prev => ({...prev, outTime: e.target.value}))}
                                                className="w-full pl-9 pr-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-bold text-gray-700"
                                            />
                                             <Clock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                                         </div>
                                     </div>
                                </div>

                                {/* Note */}
                                <div className="space-y-1.5">
                                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider">Note</label>
                                    <textarea 
                                        rows="2"
                                        value={attendanceForm.note}
                                        onChange={(e) => setAttendanceForm(prev => ({ ...prev, note: e.target.value }))}
                                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all resize-none placeholder:text-gray-400 text-sm"
                                        placeholder="Late reason, overtime info..."
                                    />
                                </div>
                            </div>
                            
                            <div className="mt-8">
                                <button type="submit" className="w-full py-3.5 bg-[#000000] text-white rounded-xl font-bold hover:bg-indigo-700 shadow-lg hover:shadow-indigo-500/30 transition-all active:scale-95">
                                    Save Attendance
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* History Modal */}
            {showHistoryModal && selectedStaff && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-scale-up border border-gray-100 flex flex-col max-h-[80vh]">
                         <div className="bg-white p-6 border-b border-gray-100 flex justify-between items-center sticky top-0 z-10">
                            <div>
                                <h2 className="text-xl font-bold text-gray-900">{selectedStaff.name}</h2>
                                <p className="text-sm text-gray-500">Attendance History (Current Month)</p>
                            </div>
                            <button onClick={() => setShowHistoryModal(false)} className="text-gray-400 hover:text-gray-600 bg-gray-50 p-2 rounded-lg transition-colors">
                                <X size={20} />
                            </button>
                        </div>
                        
                        <div className="overflow-y-auto p-4 custom-scrollbar">
                            {staffHistory.length === 0 ? (
                                <div className="text-center py-10 text-gray-400">
                                    <History size={48} className="mx-auto mb-3 opacity-20" />
                                    <p>No attendance records found for this month.</p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {staffHistory.map((record, index) => (
                                        <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100 hover:bg-white hover:shadow-md transition-all">
                                            <div className="flex items-center gap-4">
                                                <div className="bg-white p-2 rounded-lg border border-gray-200 text-center min-w-[50px]">
                                                    <div className="text-xs font-bold text-gray-400 uppercase">{new Date(record.date).toLocaleDateString('en-US', { month: 'short' })}</div>
                                                    <div className="text-xl font-black text-gray-800">{new Date(record.date).getDate()}</div>
                                                </div>
                                                <div>
                                                    <div className={`text-sm font-bold uppercase mb-1 ${
                                                        record.status === 'Present' ? 'text-green-600' :
                                                        record.status === 'Absent' ? 'text-red-500' : 'text-orange-500'
                                                    }`}>{record.status}</div>
                                                    <div className="text-xs text-gray-500 flex items-center gap-2">
                                                        <span>In: {record.inTime || '--:--'}</span>
                                                        <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
                                                        <span>Out: {record.outTime || '--:--'}</span>
                                                    </div>
                                                </div>
                                            </div>
                                            {record.note && (
                                                <div className="text-right max-w-[120px]">
                                                    <span className="text-[10px] text-gray-400 bg-white px-2 py-1 rounded border border-gray-100 inline-block truncate w-full" title={record.note}>
                                                        {record.note}
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </DashboardLayout>
    );
};

export default StaffAttendance;
