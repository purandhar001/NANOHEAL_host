import React, { useState, useEffect } from 'react';
import './AuthorityDashboard.css';

const AuthorityDashboard = ({ handleLogout }) => {
  const [reports, setReports] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  // State for the "Create New Disease" form
  const [newDiseaseName, setNewDiseaseName] = useState('');
  const [newCaseCount, setNewCaseCount] = useState('');
  const [newSymptoms, setNewSymptoms] = useState('');

  // State for the "Add New Doctor" form
  const [newDoctorName, setNewDoctorName] = useState('');
  const [newDoctorEmail, setNewDoctorEmail] = useState('');
  const [newDoctorSpec, setNewDoctorSpec] = useState('');

  // Fetch both reports and doctors data
  const fetchData = async () => {
    setIsLoading(true);
    setError('');
    try {
      const [reportsRes, doctorsRes] = await Promise.all([
        fetch('http://localhost:3001/api/reports'),
        fetch('http://localhost:3001/api/doctors')
      ]);
      if (!reportsRes.ok || !doctorsRes.ok) throw new Error('Failed to fetch data from the server');
      const reportsData = await reportsRes.json();
      const doctorsData = await doctorsRes.json();
      setReports(reportsData);
      setDoctors(doctorsData);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Handler for creating a new disease
  const handleCreateDisease = async (e) => {
    e.preventDefault();
    const symptomsArray = newSymptoms.split(',').map(symptom => symptom.trim());
    try {
      await fetch('http://localhost:3001/api/reports/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newDiseaseName,
          caseCount: parseInt(newCaseCount, 10),
          symptoms: symptomsArray
        }),
      });
      setNewDiseaseName('');
      setNewCaseCount('');
      setNewSymptoms('');
      fetchData();
    } catch (err) {
      setError(err.message);
    }
  };

  // Handler for adding a new doctor
  const handleCreateDoctor = async (e) => {
    e.preventDefault();
    try {
      await fetch('http://localhost:3001/api/doctors/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newDoctorName, email: newDoctorEmail, specialization: newDoctorSpec }),
      });
      setNewDoctorName('');
      setNewDoctorEmail('');
      setNewDoctorSpec('');
      fetchData();
    } catch (err) {
      setError(err.message);
    }
  };

  // Handler for updating cases
  const handleUpdateCases = async (reportId, casesToAdd) => {
    if (!casesToAdd || casesToAdd <= 0) return;
    try {
      await fetch(`http://localhost:3001/api/reports/update/${reportId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ casesToAdd: parseInt(casesToAdd, 10) }),
      });
      fetchData();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="dashboard-container">
      {/* Header */}
      <header className="dashboard-header">
        <div className="dashboard-header-content">
          <h1>Authority Dashboard</h1>
          <p>Manage Local Health Reports</p>
        </div>
        <button onClick={handleLogout} className="header-logout-button">Logout</button>
      </header>

      {/* Main Content */}
      <div className="dashboard-content">
        <div className="form-section">
          <h2>Add New Disease Report</h2>
          <form onSubmit={handleCreateDisease} className="create-form">
            <input type="text" value={newDiseaseName} onChange={(e) => setNewDiseaseName(e.target.value)} placeholder="Disease Name" required />
            <input type="number" value={newCaseCount} onChange={(e) => setNewCaseCount(e.target.value)} placeholder="Initial Case Count" required />
            <textarea value={newSymptoms} onChange={(e) => setNewSymptoms(e.target.value)} placeholder="Symptoms (comma-separated)" required />
            <button type="submit">Create Report</button>
          </form>

          <h2 style={{ marginTop: '2rem' }}>Add New Doctor</h2>
          <form onSubmit={handleCreateDoctor} className="create-form">
            <input type="text" value={newDoctorName} onChange={(e) => setNewDoctorName(e.target.value)} placeholder="Doctor's Name" required />
            <input type="email" value={newDoctorEmail} onChange={(e) => setNewDoctorEmail(e.target.value)} placeholder="Doctor's Email" required />
            <input type="text" value={newDoctorSpec} onChange={(e) => setNewDoctorSpec(e.target.value)} placeholder="Specialization" required />
            <button type="submit">Add Doctor</button>
          </form>
        </div>

        <div className="reports-section">
          {error && <p className="error-message">{error}</p>}
          
          <h2>Verified Doctors List</h2>
          {isLoading ? <p>Loading...</p> : doctors.map(doc => (
            <div key={doc.id} className="report-card">
              <h3>{doc.name}</h3>
              <p><strong>Specialization:</strong> {doc.specialization}</p>
              <p><strong>Email:</strong> {doc.email}</p>
            </div>
          ))}

          <h2 style={{ marginTop: '2rem' }}>Current Health Reports</h2>
          {isLoading ? <p>Loading...</p> : reports.map((report) => (
            <div key={report.id} className="report-card">
              <h3>{report.name}</h3>
              <p className="case-count">Case Count: <span>{report.caseCount}</span></p>
              <div className="symptoms-list">
                <strong>Symptoms:</strong>
                <div>{report.symptoms.map(s => <span key={s} className="symptom-tag">{s}</span>)}</div>
              </div>
              <div className="update-form">
                <input type="number" id={`update-${report.id}`} placeholder="Add cases" min="1" />
                <button onClick={() => {
                  const casesToAdd = document.getElementById(`update-${report.id}`).value;
                  handleUpdateCases(report.id, casesToAdd);
                }}>Update</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AuthorityDashboard;
