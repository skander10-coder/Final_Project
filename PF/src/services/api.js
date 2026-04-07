import axios from 'axios'

const api = axios.create({
    baseURL: 'http://localhost:5000',
    withCredentials: true
});

// Company Internship APIs
export const companyAPI = {
    // Get all internships for this company
    getInternships: () => api.get('/api/company/internships'),

    // Create new internship
    createInternship: (data) => api.post('/api/company/internships', data),

    updateInternship: (id, data) => api.put(`/api/company/internships/${id}`, data),

    // Delete internship
    deleteInternship: (id) => api.delete(`/api/company/internships/${id}`),


    getApplications: () => api.get('/api/company/applications'),
    updateApplicationStatus: (applicationId, status) =>
        api.put(`/api/company/applications/${applicationId}`, { status }),

    getProfile: () => api.get('/api/company/profile'),
    updateProfile: (data) => api.post('/api/company/profile', data),
};


// Student Internship APIs
export const studentAPI = {
    // Get all active internships
    // getInternships: () => api.get('/api/student/internships'),
    getInternships: (search = '') =>
        api.get(`/api/student/internships?search=${encodeURIComponent(search)}`),

    apply: (offerId) => api.post(`/api/student/internships/${offerId}/apply`),
    getApplications: () => api.get('/api/student/applications'),
    getProfile: () => api.get('/api/student/profile'),
    updateProfile: (data) => api.post('/api/student/profile', data),
};


// Admin APIs
export const adminAPI = {
    // Get pending offers waiting for approval
    getPendingOffers: () => api.get('/api/admin/pending-offers'),

    // Approve an offer
    approveOffer: (offerId) => api.put(`/api/admin/approve-offer/${offerId}`),

    // Reject an offer
    rejectOffer: (offerId) => api.delete(`/api/admin/reject-offer/${offerId}`),

    getAcceptedApplications: () => api.get('/api/admin/accepted-applications'),
    validateApplication: (applicationId) => api.post(`/api/admin/validate/${applicationId}`),
    rejectApplication: (applicationId, reason) => api.post(`/api/admin/reject-application/${applicationId}`, { reason }),

    getProfile: () => api.get('/api/admin/profile'),
    updateProfile: (data) => api.post('/api/admin/profile', data),

    getAllStudents: () => api.get('/api/admin/students'),
    getAllCompanies: () => api.get('/api/admin/companies'),
};



// Notification APIs
export const notificationAPI = {
    // Get all notifications
    getNotifications: (page = 1) => api.get(`/api/notifications?page=${page}`),

    // Get unread count
    getUnreadCount: () => api.get('/api/notifications/unread-count'),

    // Mark as read
    markAsRead: (id) => api.put(`/api/notifications/${id}/read`),

    // Mark all as read
    markAllAsRead: () => api.put('/api/notifications/read-all'),

    // Delete notification
    delete: (id) => api.delete(`/api/notifications/${id}`),
};


export default api;


