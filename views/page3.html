<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>EDI Management System - Page 3</title>
    <link rel="stylesheet" href="/css/style.css">
</head>
<body>
    <nav class="navbar">
        <div class="nav-brand">
            <h2>EDI Management System</h2>
        </div>
        <div class="nav-links">
            <a href="/pages/page1">Page 1</a>
            <a href="/pages/page2">Page 2</a>
            <a href="/pages/page3" class="active">Page 3</a>
        </div>
        <div class="nav-user">
            <span class="username">Welcome, <span id="current-user">admin</span></span>
            <form method="POST" action="/auth/logout" style="display: inline;">
                <button type="submit" class="logout-btn">Logout</button>
            </form>
        </div>
    </nav>

    <main class="main-content">
        <div class="page-header">
            <h1>Sample Page 3</h1>
            <p>This is the third sample page for reports and analytics.</p>
        </div>
        
        <div class="content-grid">
            <div class="card full-width">
                <h3>Activity Report</h3>
                <p>This page shows activity logs and analytics. <strong>Database features coming in Phase 2!</strong></p>
                
                <div class="report-controls">
                    <button class="primary-btn" onclick="loadActivityLog()">Load Activity Log</button>
                    <button class="secondary-btn" onclick="exportReport()">Export Report</button>
                </div>
                
                <div id="activity-log" class="log-container">
                    <div class="log-entry">
                        <span class="log-time">Ready</span>
                        <span class="log-action">Click "Load Activity Log" to see current status</span>
                    </div>
                </div>
            </div>
            
            <div class="card">
                <h3>Quick Actions</h3>
                <div class="action-buttons">
                    <button class="action-btn" onclick="refreshData()">Refresh Data</button>
                    <button class="action-btn" onclick="clearCache()">Clear Cache</button>
                    <button class="action-btn" onclick="showHelp()">Show Help</button>
                </div>
            </div>
            
            <div class="card">
                <h3>System Status</h3>
                <div class="status-indicators">
                    <div class="status-item">
                        <span class="status-light green"></span>
                        <span>Application Running</span>
                    </div>
                    <div class="status-item">
                        <span class="status-light green"></span>
                        <span>Session Active</span>
                    </div>
                    <div class="status-item">
                        <span class="status-light" id="db-status-light"></span>
                        <span id="db-status-text">Database: Checking...</span>
                    </div>
                </div>
            </div>
        </div>
    </main>

    <script src="/js/main.js"></script>
    <script>
        // Load user info and check system status
        fetch('/auth/status')
            .then(response => response.json())
            .then(data => {
                if (data.username) {
                    document.getElementById('current-user').textContent = data.username;
                }
                
                // Update database status indicator
                const dbLight = document.getElementById('db-status-light');
                const dbText = document.getElementById('db-status-text');
                
                if (data.database === 'connected') {
                    dbLight.className = 'status-light green';
                    dbText.textContent = 'Database: Connected';
                } else {
                    dbLight.className = 'status-light yellow';
                    dbText.textContent = 'Database: Phase 2 (Memory Store)';
                }
            })
            .catch(error => {
                console.error('Error loading user status:', error);
                // Update status to show error
                const dbLight = document.getElementById('db-status-light');
                const dbText = document.getElementById('db-status-text');
                dbLight.className = 'status-light red';
                dbText.textContent = 'Database: Error checking status';
            });
        
        // Mock activity log loading
        function loadActivityLog() {
            const logContainer = document.getElementById('activity-log');
            
            // Check if database is connected via the health API
            fetch('/api/health')
                .then(response => response.json())
                .then(data => {
                    if (data.database === 'connected') {
                        // Database is connected - show real logs (future feature)
                        logContainer.innerHTML = `
                            <div class="log-entry">
                                <span class="log-time">${new Date().toLocaleTimeString()}</span>
                                <span class="log-action">DATABASE_CONNECTED</span>
                                <span class="log-details">Real activity logging enabled</span>
                            </div>
                        `;
                    } else {
                        // No database - show demo logs
                        logContainer.innerHTML = `
                            <div class="log-entry">
                                <span class="log-time">${new Date().toLocaleTimeString()}</span>
                                <span class="log-action">DEMO_MODE</span>
                                <span class="log-details">Database not connected - showing demo data</span>
                            </div>
                            <div class="log-entry">
                                <span class="log-time">${new Date(Date.now() - 30000).toLocaleTimeString()}</span>
                                <span class="log-action">PAGE_ACCESS</span>
                                <span class="log-details">/pages/page2 (demo)</span>
                            </div>
                            <div class="log-entry">
                                <span class="log-time">${new Date(Date.now() - 60000).toLocaleTimeString()}</span>
                                <span class="log-action">LOGIN_SUCCESS</span>
                                <span class="log-details">User: admin (demo)</span>
                            </div>
                            <div class="log-entry">
                                <span class="log-time">${new Date(Date.now() - 120000).toLocaleTimeString()}</span>
                                <span class="log-action">PAGE_ACCESS</span>
                                <span class="log-details">/pages/page1 (demo)</span>
                            </div>
                        `;
                    }
                })
                .catch(error => {
                    logContainer.innerHTML = `
                        <div class="log-entry">
                            <span class="log-time">${new Date().toLocaleTimeString()}</span>
                            <span class="log-action">ERROR</span>
                            <span class="log-details">Unable to load activity logs</span>
                        </div>
                    `;
                });
        }
        
        function exportReport() {
            alert('Report export functionality would be implemented here');
        }
        
        function refreshData() {
            alert('Data refresh completed');
            loadActivityLog();
        }
        
        function clearCache() {
            alert('Cache cleared successfully');
        }
        
        function showHelp() {
            alert('Help: This is Page 3 for reports and analytics. Use the buttons to interact with the system.');
        }
    </script>
</body>
</html>