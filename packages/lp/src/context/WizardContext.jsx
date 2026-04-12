import { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import Cookies from 'js-cookie';
import * as reportApi from '../api/reportApi';

const WizardContext = createContext(null);

const COOKIE_KEY = 'wq_report_session';
const COOKIE_EXPIRY = 30; // days

export function WizardProvider({ children }) {
    const [reportId, setReportId] = useState(null);
    const [nic, setNic] = useState('');
    const [currentStep, setCurrentStep] = useState(0);
    const [reportData, setReportData] = useState({});
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState(null);
    const [existingReports, setExistingReports] = useState([]);

    // Ref that is updated synchronously whenever reportData changes.
    // This allows goNext/goBack in WizardPage to always read the latest
    // reportData for skip-logic even when called before the next render.
    const reportDataRef = useRef({});

    // Helper: update reportData state AND ref atomically so consumers that
    // read reportDataRef.current always get the latest value.
    const updateReportData = useCallback((data) => {
        reportDataRef.current = data;
        setReportData(data);
    }, []);

    // Restore session from cookie on mount
    useEffect(() => {
        const session = Cookies.get(COOKIE_KEY);
        if (session) {
            try {
                const { nic: savedNic, reportId: savedId } = JSON.parse(session);
                if (savedNic) setNic(savedNic);
                if (savedId) {
                    setReportId(savedId);
                    loadReport(savedId);
                }
            } catch {
                Cookies.remove(COOKIE_KEY);
            }
        }
    }, []);

    // Save session to cookie whenever reportId or nic changes
    const saveSession = useCallback((nicVal, idVal) => {
        Cookies.set(COOKIE_KEY, JSON.stringify({ nic: nicVal, reportId: idVal }), {
            expires: COOKIE_EXPIRY,
            sameSite: 'lax',
        });
    }, []);

    // Load existing report from server
    const loadReport = useCallback(async (id) => {
        setLoading(true);
        setError(null);
        try {
            const report = await reportApi.getReport(id);
            updateReportData(report);
            setCurrentStep(report.currentStep || 0);
            setNic(report.nic);
        } catch (err) {
            setError('Failed to load report');
            Cookies.remove(COOKIE_KEY);
        } finally {
            setLoading(false);
        }
    }, []);

    // Check for existing reports by NIC
    const checkExistingReports = useCallback(async (nicValue) => {
        try {
            const reports = await reportApi.getReportsByNic(nicValue);
            setExistingReports(reports);
            return reports;
        } catch {
            return [];
        }
    }, []);

    // Start a new wizard / report
    const startNewReport = useCallback(async (nicValue) => {
        setLoading(true);
        setError(null);
        try {
            const report = await reportApi.createReport(nicValue);
            setReportId(report._id);
            setNic(nicValue);
            setCurrentStep(1);
            updateReportData(report);
            saveSession(nicValue, report._id);
            return report;
        } catch (err) {
            const msg = err.response?.data?.message || 'Failed to start report';
            setError(msg);
            throw err;
        } finally {
            setLoading(false);
        }
    }, [saveSession]);

    // Resume an in-progress report
    const resumeReport = useCallback(async (report) => {
        setReportId(report._id);
        setNic(report.nic);
        saveSession(report.nic, report._id);
        await loadReport(report._id);
    }, [saveSession, loadReport]);

    // Auto-save a wizard step's answers
    const saveStepData = useCallback(async (stepData, nextStep) => {
        if (!reportId) return;
        setSaving(true);
        setError(null);
        try {
            const updates = { ...stepData };
            if (nextStep !== undefined) {
                updates.currentStep = nextStep;
            }
            const updated = await reportApi.updateReport(reportId, updates);
            updateReportData(updated);
            if (nextStep !== undefined) {
                setCurrentStep(nextStep);
            }
        } catch (err) {
            setError('Failed to save. Please try again.');
        } finally {
            setSaving(false);
        }
    }, [reportId]);

    // Submit / finalize the report
    const submitReport = useCallback(async () => {
        if (!reportId) return;
        setLoading(true);
        setError(null);
        try {
            const result = await reportApi.submitReport(reportId);
            updateReportData(result);
            Cookies.remove(COOKIE_KEY);
            return result;
        } catch (err) {
            setError('Failed to submit report');
            throw err;
        } finally {
            setLoading(false);
        }
    }, [reportId]);

    // Clear session
    const clearSession = useCallback(() => {
        Cookies.remove(COOKIE_KEY);
        setReportId(null);
        setNic('');
        setCurrentStep(0);
        updateReportData({});
        setExistingReports([]);
    }, []);

    const value = {
        reportId,
        nic,
        currentStep,
        reportData,
        reportDataRef,
        loading,
        saving,
        error,
        existingReports,
        setCurrentStep,
        setNic,
        setError,
        startNewReport,
        resumeReport,
        checkExistingReports,
        saveStepData,
        submitReport,
        clearSession,
        loadReport,
    };

    return (
        <WizardContext.Provider value={value}>
            {children}
        </WizardContext.Provider>
    );
}

export function useWizard() {
    const ctx = useContext(WizardContext);
    if (!ctx) throw new Error('useWizard must be used inside WizardProvider');
    return ctx;
}

export default WizardContext;
