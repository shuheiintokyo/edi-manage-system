<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>EDI Management System - Dashboard</title>
    <link rel="stylesheet" href="/css/style.css">
    <script src="https://cdnjs.cloudflare.com/ajax/libs/Chart.js/3.9.1/chart.min.js"></script>
    <style>
        /* Enhanced EDI Dashboard Styles */
        .dashboard-container {
            max-width: 1400px;
            margin: 0 auto;
            padding: 20px;
        }

        .dashboard-header {
            text-align: center;
            margin-bottom: 30px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 30px;
            border-radius: 15px;
            box-shadow: 0 8px 25px rgba(0,0,0,0.1);
        }

        .dashboard-header h1 {
            margin: 0 0 10px 0;
            font-size: 2.5rem;
        }

        /* Product Tabs */
        .product-tabs {
            display: flex;
            background: #f8fafc;
            border-bottom: 2px solid #e5e7eb;
            border-radius: 10px 10px 0 0;
            overflow-x: auto;
            margin-bottom: 0;
            margin-top: 30px;
        }

        .product-tab {
            padding: 15px 25px;
            background: none;
            border: none;
            cursor: pointer;
            font-size: 14px;
            font-weight: 600;
            white-space: nowrap;
            border-bottom: 3px solid transparent;
            transition: all 0.3s ease;
            min-width: 200px;
            text-align: center;
        }

        .product-tab:hover {
            background: #e5e7eb;
        }

        .product-tab.active {
            background: white;
            border-bottom-color: #667eea;
            color: #667eea;
        }

        .product-tab .tab-code {
            display: block;
            font-size: 16px;
            font-weight: 700;
            margin-bottom: 3px;
        }

        .product-tab .tab-name {
            display: block;
            font-size: 12px;
            opacity: 0.7;
        }

        .product-tab .tab-count {
            display: block;
            font-size: 11px;
            opacity: 0.6;
            margin-top: 2px;
        }

        .tab-content {
            display: none;
            background: white;
            border: 1px solid #e5e7eb;
            border-top: none;
            border-radius: 0 0 10px 10px;
            padding: 30px;
            min-height: 500px;
        }

        .tab-content.active {
            display: block;
        }

        .chart-container {
            background: white;
            border-radius: 15px;
            padding: 25px;
            box-shadow: 0 8px 25px rgba(0,0,0,0.1);
            border: 1px solid #e5e7eb;
            margin-bottom: 30px;
        }

        .chart-container h3 {
            margin: 0 0 20px 0;
            color: #374151;
            font-size: 1.4rem;
        }

        .chart-wrapper {
            position: relative;
            height: 400px;
        }

        .upload-section {
            background: white;
            border-radius: 15px;
            padding: 25px;
            box-shadow: 0 8px 25px rgba(0,0,0,0.1);
            border: 1px solid #e5e7eb;
            margin-bottom: 30px;
        }

        .upload-area {
            border: 3px dashed #cbd5e1;
            border-radius: 12px;
            padding: 40px;
            text-align: center;
            background: #f8fafc;
            transition: all 0.3s ease;
            position: relative;
        }

        .upload-area:hover {
            border-color: #667eea;
            background: #f0f4ff;
        }

        .upload-area.dragover {
            border-color: #667eea;
            background: #e0e7ff;
            transform: scale(1.02);
        }

        .file-input {
            display: none;
        }

        .upload-btn {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            border: none;
            padding: 12px 25px;
            border-radius: 8px;
            font-size: 1rem;
            font-weight: 600;
            cursor: pointer;
            transition: transform 0.2s;
        }

        .upload-btn:hover {
            transform: translateY(-2px);
        }

        .main-orders-section {
            background: white;
            border-radius: 15px;
            padding: 25px;
            box-shadow: 0 8px 25px rgba(0,0,0,0.1);
            border: 1px solid #e5e7eb;
            margin-bottom: 30px;
        }

        .orders-section {
            background: white;
            border-radius: 15px;
            padding: 25px;
            box-shadow: 0 8px 25px rgba(0,0,0,0.1);
            border: 1px solid #e5e7eb;
        }

        .orders-table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 20px;
        }

        .orders-table th,
        .orders-table td {
            padding: 12px;
            text-align: left;
            border-bottom: 1px solid #e5e7eb;
        }

        .orders-table th {
            background: #f8fafc;
            font-weight: 600;
            color: #374151;
        }

        .orders-table tr:hover {
            background: #f8fafc;
        }

        .status-indicator {
            display: inline-block;
            width: 80px;
            height: 30px;
            border-radius: 15px;
            text-align: center;
            line-height: 30px;
            font-size: 0.8rem;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s ease;
            user-select: none;
        }

        .status-indicator:hover {
            transform: scale(1.05);
            box-shadow: 0 4px 12px rgba(0,0,0,0.2);
        }

        .status-default {
            background: #3b82f6;
            color: white;
        }

        .status-half {
            background: #fbbf24;
            color: white;
        }

        .status-three-quarter {
            background: #f97316;
            color: white;
        }

        .status-finished {
            background: #10b981;
            color: white;
        }

        .controls-section {
            display: flex;
            gap: 15px;
            margin-bottom: 20px;
            flex-wrap: wrap;
        }

        .btn {
            padding: 10px 20px;
            border: none;
            border-radius: 8px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s ease;
        }

        .btn-primary {
            background: #3b82f6;
            color: white;
        }

        .btn-success {
            background: #10b981;
            color: white;
        }

        .btn-warning {
            background: #f59e0b;
            color: white;
        }

        .btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(0,0,0,0.2);
        }

        .stats-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 20px;
            margin-bottom: 30px;
        }

        .stat-card {
            background: white;
            border-radius: 12px;
            padding: 20px;
            text-align: center;
            box-shadow: 0 4px 15px rgba(0,0,0,0.1);
            border: 1px solid #e5e7eb;
        }

        .stat-number {
            font-size: 2rem;
            font-weight: bold;
            color: #667eea;
            margin-bottom: 5px;
        }

        .stat-label {
            color: #6b7280;
            font-size: 0.9rem;
        }

        .loading {
            text-align: center;
            padding: 40px;
            color: #6b7280;
        }

        .spinner {
            border: 3px solid #f3f3f3;
            border-top: 3px solid #667eea;
            border-radius: 50%;
            width: 40px;
            height: 40px;
            animation: spin 1s linear infinite;
            margin: 0 auto 15px;
        }

        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }

        .message {
            padding: 15px;
            border-radius: 8px;
            margin-bottom: 20px;
            font-weight: 500;
        }

        .message.success {
            background: #d1fae5;
            border: 1px solid #10b981;
            color: #065f46;
        }

        .message.error {
            background: #fee2e2;
            border: 1px solid #ef4444;
            color: #991b1b;
        }

        .message.info {
            background: #dbeafe;
            border: 1px solid #3b82f6;
            color: #1e40af;
        }

        .product-summary {
            background: linear-gradient(135deg, #f0f4ff 0%, #e0e7ff 100%);
            border: 2px solid #667eea;
            border-radius: 12px;
            padding: 20px;
            margin-bottom: 25px;
        }

        .product-info {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 15px;
        }

        .product-details h3 {
            margin: 0;
            color: #1f2937;
            font-size: 1.4rem;
        }

        .product-details p {
            margin: 5px 0 0 0;
            color: #6b7280;
            font-size: 0.95rem;
        }

        .product-stats {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
            gap: 15px;
            margin-top: 15px;
        }

        .stat-item {
            text-align: center;
            padding: 15px;
            background: white;
            border-radius: 8px;
            border: 1px solid #667eea;
        }

        .stat-item .stat-number {
            font-size: 1.5rem;
            font-weight: 700;
            color: #667eea;
            margin-bottom: 5px;
        }

        .stat-item .stat-label {
            color: #6b7280;
            font-size: 0.9rem;
            font-weight: 500;
        }

        @media (max-width: 768px) {
            .product-tabs {
                flex-direction: column;
            }
            
            .product-tab {
                min-width: auto;
                text-align: left;
            }
            
            .controls-section {
                flex-direction: column;
            }
            
            .orders-table {
                font-size: 0.8rem;
            }
            
            .orders-table th,
            .orders-table td {
                padding: 8px;
            }
        }
    </style>
</head>
<body>
    <nav class="navbar">
        <div class="nav-brand">
            <h2>EDI Management System</h2>
        </div>
        <div class="nav-links">
            <a href="/edi/dashboard" class="active">📊 Dashboard</a>
            <a href="/forecast/dashboard">📈 Forecast</a>
        </div>
        <div class="nav-user">
            <span class="username">Welcome, <span id="current-user">admin</span></span>
            <button class="logout-btn" onclick="logout()">Logout</button>
        </div>
    </nav>

    <div class="dashboard-container">
        <div class="dashboard-header">
            <h1>📊 EDI Management Dashboard</h1>
            <p>Production orders tracking with real-time status updates and forecast integration</p>
        </div>

        <div id="messageContainer"></div>

        <!-- Statistics Grid -->
        <div class="stats-grid">
            <div class="stat-card">
                <div class="stat-number" id="total-orders">0</div>
                <div class="stat-label">Total Orders</div>
            </div>
            <div class="stat-card">
                <div class="stat-number" id="recent-orders">0</div>
                <div class="stat-label">Recent Orders</div>
            </div>
            <div class="stat-card">
                <div class="stat-number" id="unique-products">0</div>
                <div class="stat-label">Unique Products</div>
            </div>
            <div class="stat-card">
                <div class="stat-number" id="completed-orders">0</div>
                <div class="stat-label">Completed Orders</div>
            </div>
        </div>

        <!-- File Upload Section -->
        <div class="upload-section">
            <h3>📁 Upload EDI Files</h3>
            <div class="upload-area" id="uploadArea">
                <input type="file" id="fileInput" class="file-input" accept=".edidat,.txt,.dat" multiple>
                <div id="uploadContent">
                    <p style="font-size: 1.2rem; margin-bottom: 15px;">🔼 Drop EDI files here or click to browse</p>
                    <button type="button" class="upload-btn" onclick="document.getElementById('fileInput').click()">
                        Choose Files
                    </button>
                    <p style="margin-top: 15px; color: #6b7280; font-size: 0.9rem;">
                        Supported formats: .EDIdat, .txt, .dat
                    </p>
                </div>
            </div>
        </div>

        <!-- Main Orders List (Prioritized) -->
        <div class="main-orders-section">
            <div class="controls-section">
                <button class="btn btn-primary" onclick="loadOrders()">🔄 Refresh Orders</button>
                <button class="btn btn-success" onclick="loadChartData()">📊 Update Data</button>
                <button class="btn btn-warning" onclick="showDebugInfo()">🔍 Debug Info</button>
            </div>

            <div id="loadingIndicator" class="loading" style="display: none;">
                <div class="spinner"></div>
                Loading orders...
            </div>

            <div id="mainOrdersContainer">
                <h3>📋 All Production Orders (Prioritized by Product & Delivery Date)</h3>
                <p>Orders sorted by product priority first, then by delivery date. Click status to update progress.</p>
                <table class="orders-table" id="mainOrdersTable">
                    <thead>
                        <tr>
                            <th>Product Code</th>
                            <th>Product Name</th>
                            <th>Order Number</th>
                            <th>Quantity</th>
                            <th>Delivery Date</th>
                            <th>Status</th>
                            <th>Updated</th>
                        </tr>
                    </thead>
                    <tbody id="mainOrdersTableBody">
                        <tr>
                            <td colspan="7" style="text-align: center; padding: 40px; color: #6b7280;">
                                Click "Refresh Orders" to load current orders
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>

        <!-- Product Tabs -->
        <div class="product-tabs" id="productTabs">
            <!-- Tabs will be generated dynamically -->
        </div>

        <!-- Tab Contents -->
        <div id="tabContents">
            <!-- Tab contents will be generated dynamically -->
        </div>
    </div>

    <script src="/js/main.js"></script>
    <script>
        class EDIDashboard {
            constructor() {
                this.orders = [];
                this.forecasts = {};
                this.charts = {};
                this.activeProductCode = null;
                
                // Product priority order and mapping
                this.productPriority = [
                    'PP4166-4681P003',
                    'PP4166-4681P004', 
                    'PP4166-4726P003',
                    'PP4166-4726P004',
                    'PP4166-4731P002',
                    'PP4166-7106P003',
                    'PP4166-7106P001'
                ];

                this.productMappings = {
                    'PP4166-4681P003': 'アッパフレーム',     // Upper Frame
                    'PP4166-4681P004': 'アッパフレーム',     // Upper Frame  
                    'PP4166-4726P003': 'トッププレート',     // Top Plate
                    'PP4166-4726P004': 'トッププレート',     // Top Plate
                    'PP4166-4731P002': 'ミドルフレーム',     // Middle Frame
                    'PP4166-7106P003': 'ミドルフレーム',     // Middle Frame
                    'PP4166-7106P001': 'ミドルフレーム'      // Middle Frame
                };

                this.statusMap = {
                    'default': { label: 'Default', color: '#3b82f6', clicks: 0 },
                    'half': { label: '1/2 Done', color: '#fbbf24', clicks: 1 },
                    'three-quarter': { label: '3/4 Done', color: '#f97316', clicks: 2 },
                    'finished': { label: 'Finished', color: '#10b981', clicks: 3 }
                };
                this.longPressTimer = null;
                this.clickCounts = new Map();
            }

            async initialize() {
                console.log('🚀 Initializing EDI Dashboard...');
                
                await this.loadUserInfo();
                await this.loadOrders();
                await this.loadForecastData();
                await this.loadStats();
                this.setupFileUpload();
                this.initializeProductTabs();
                
                console.log('✅ EDI Dashboard initialized');
            }

            async loadUserInfo() {
                try {
                    const response = await fetch('/auth/status');
                    const data = await response.json();
                    
                    if (data.username) {
                        document.getElementById('current-user').textContent = data.username;
                    }
                } catch (error) {
                    console.error('Error loading user info:', error);
                }
            }

            // Sort orders by product priority first, then by delivery date
            sortOrdersByPriority(orders) {
                return orders.sort((a, b) => {
                    // First priority: Product order
                    const priorityA = this.productPriority.indexOf(a.product_code);
                    const priorityB = this.productPriority.indexOf(b.product_code);
                    
                    // If both products are in priority list
                    if (priorityA !== -1 && priorityB !== -1) {
                        if (priorityA !== priorityB) {
                            return priorityA - priorityB;
                        }
                    }
                    // If only one is in priority list, prioritize it
                    else if (priorityA !== -1) {
                        return -1;
                    }
                    else if (priorityB !== -1) {
                        return 1;
                    }
                    
                    // Second priority: Delivery date (earliest first)
                    const dateA = new Date(a.delivery_date || '9999-12-31');
                    const dateB = new Date(b.delivery_date || '9999-12-31');
                    
                    return dateA.getTime() - dateB.getTime();
                });
            }

            async loadOrders() {
                try {
                    this.showLoading(true);
                    
                    const response = await fetch('/edi/orders?limit=1000');
                    if (!response.ok) throw new Error(`HTTP ${response.status}`);
                    
                    const data = await response.json();
                    this.orders = data.orders || [];
                    
                    // Sort orders by priority
                    this.orders = this.sortOrdersByPriority(this.orders);
                    
                    this.renderMainOrdersTable();
                    this.updateProductTabs();
                    
                } catch (error) {
                    this.showMessage('Failed to load orders: ' + error.message, 'error');
                    console.error('Error loading orders:', error);
                } finally {
                    this.showLoading(false);
                }
            }

            async loadForecastData() {
                try {
                    const response = await fetch('/forecast/api/forecasts');
                    if (response.ok) {
                        const forecasts = await response.json();
                        
                        // Convert to lookup object by product and month
                        this.forecasts = {};
                        forecasts.forEach(forecast => {
                            const key = `${forecast.drawing_number}-${forecast.month_date}`;
                            this.forecasts[key] = forecast.quantity;
                        });
                        
                        console.log('📊 Loaded forecast data:', Object.keys(this.forecasts).length, 'entries');
                    }
                } catch (error) {
                    console.error('Error loading forecast data:', error);
                }
            }

            async loadStats() {
                try {
                    const response = await fetch('/edi/stats');
                    if (response.ok) {
                        const stats = await response.json();
                        
                        document.getElementById('total-orders').textContent = stats.totalOrders || 0;
                        document.getElementById('recent-orders').textContent = stats.recentOrders || 0;
                        document.getElementById('unique-products').textContent = stats.uniqueProducts || 0;
                        
                        // Calculate completed orders
                        const completedCount = this.orders.filter(order => order.status === 'finished').length;
                        document.getElementById('completed-orders').textContent = completedCount;
                    }
                } catch (error) {
                    console.error('Error loading stats:', error);
                }
            }

            renderMainOrdersTable() {
                const tbody = document.getElementById('mainOrdersTableBody');
                
                if (this.orders.length === 0) {
                    tbody.innerHTML = `
                        <tr>
                            <td colspan="7" style="text-align: center; padding: 40px; color: #6b7280;">
                                No orders found. Upload EDI files to see orders here.
                            </td>
                        </tr>
                    `;
                    return;
                }

                tbody.innerHTML = this.orders.map(order => {
                    const status = order.status || 'default';
                    const statusInfo = this.statusMap[status];
                    const productName = this.productMappings[order.product_code] || order.product_name || order.product_code;
                    
                    return `
                        <tr>
                            <td><strong>${order.product_code}</strong></td>
                            <td>${productName}</td>
                            <td>${order.order_number}</td>
                            <td>${order.order_quantity}</td>
                            <td>${order.delivery_date}</td>
                            <td>
                                <span class="status-indicator status-${status}" 
                                      data-order-id="${order.id}"
                                      data-current-status="${status}"
                                      onclick="ediDashboard.handleStatusClick(this)"
                                      onmousedown="ediDashboard.handleStatusMouseDown(this)"
                                      onmouseup="ediDashboard.handleStatusMouseUp(this)"
                                      onmouseleave="ediDashboard.handleStatusMouseUp(this)">
                                    ${statusInfo.label}
                                </span>
                            </td>
                            <td>${order.status_updated_at ? new Date(order.status_updated_at).toLocaleDateString() : 'N/A'}</td>
                        </tr>
                    `;
                }).join('');
            }

            initializeProductTabs() {
                const tabsContainer = document.getElementById('productTabs');
                const contentsContainer = document.getElementById('tabContents');
                
                tabsContainer.innerHTML = '';
                contentsContainer.innerHTML = '';
                
                this.productPriority.forEach((productCode, index) => {
                    const productName = this.productMappings[productCode];
                    
                    const tabButton = document.createElement('button');
                    tabButton.className = `product-tab ${index === 0 ? 'active' : ''}`;
                    tabButton.onclick = () => this.switchToProduct(productCode);
                    tabButton.innerHTML = `
                        <span class="tab-code">${productCode}</span>
                        <span class="tab-name">${productName}</span>
                        <span class="tab-count" id="count-${productCode}">0 orders</span>
                    `;
                    tabsContainer.appendChild(tabButton);
                    
                    const tabContent = document.createElement('div');
                    tabContent.className = `tab-content ${index === 0 ? 'active' : ''}`;
                    tabContent.id = `tab-${productCode}`;
                    tabContent.innerHTML = this.generateTabContent(productCode, productName);
                    contentsContainer.appendChild(tabContent);
                    
                    if (index === 0) {
                        this.activeProductCode = productCode;
                    }
                });
                
                this.updateProductTabs();
            }

            generateTabContent(productCode, productName) {
                return `
                    <div class="product-summary">
                        <div class="product-info">
                            <div class="product-details">
                                <h3>${productCode}</h3>
                                <p>${productName} - Individual Product Analysis</p>
                            </div>
                        </div>
                        <div class="product-stats" id="stats-${productCode}">
                            <div class="stat-item">
                                <div class="stat-number" id="total-${productCode}">0</div>
                                <div class="stat-label">Total Orders</div>
                            </div>
                            <div class="stat-item">
                                <div class="stat-number" id="pending-${productCode}">0</div>
                                <div class="stat-label">Pending Orders</div>
                            </div>
                            <div class="stat-item">
                                <div class="stat-number" id="finished-${productCode}">0</div>
                                <div class="stat-label">Finished Orders</div>
                            </div>
                            <div class="stat-item">
                                <div class="stat-number" id="quantity-${productCode}">0</div>
                                <div class="stat-label">Total Quantity</div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="chart-container">
                        <h3>📈 ${productCode} - Orders & Forecast Timeline</h3>
                        <div class="chart-wrapper">
                            <canvas id="chart-${productCode}"></canvas>
                        </div>
                    </div>

                    <div class="orders-section">
                        <h3>📋 ${productCode} Orders</h3>
                        <table class="orders-table">
                            <thead>
                                <tr>
                                    <th>Order Number</th>
                                    <th>Quantity</th>
                                    <th>Delivery Date</th>
                                    <th>Status</th>
                                    <th>Updated</th>
                                </tr>
                            </thead>
                            <tbody id="orders-${productCode}">
                                <tr>
                                    <td colspan="5" style="text-align: center; padding: 20px; color: #6b7280;">
                                        No orders for this product
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                `;
            }

            updateProductTabs() {
                this.productPriority.forEach(productCode => {
                    const productOrders = this.orders.filter(order => order.product_code === productCode);
                    
                    // Update tab count
                    const countElement = document.getElementById(`count-${productCode}`);
                    if (countElement) {
                        countElement.textContent = `${productOrders.length} orders`;
                    }
                    
                    // Update product stats
                    const totalOrders = productOrders.length;
                    const finishedOrders = productOrders.filter(order => order.status === 'finished').length;
                    const pendingOrders = totalOrders - finishedOrders;
                    const totalQuantity = productOrders.reduce((sum, order) => sum + (parseInt(order.order_quantity) || 0), 0);
                    
                    const totalEl = document.getElementById(`total-${productCode}`);
                    const pendingEl = document.getElementById(`pending-${productCode}`);
                    const finishedEl = document.getElementById(`finished-${productCode}`);
                    const quantityEl = document.getElementById(`quantity-${productCode}`);
                    
                    if (totalEl) totalEl.textContent = totalOrders;
                    if (pendingEl) pendingEl.textContent = pendingOrders;
                    if (finishedEl) finishedEl.textContent = finishedOrders;
                    if (quantityEl) quantityEl.textContent = totalQuantity.toLocaleString();
                    
                    // Update product orders table
                    this.updateProductOrdersTable(productCode, productOrders);
                    
                    // Update product chart
                    this.updateProductChart(productCode, productOrders);
                });
            }

            updateProductOrdersTable(productCode, orders) {
                const tbody = document.getElementById(`orders-${productCode}`);
                if (!tbody) return;
                
                if (orders.length === 0) {
                    tbody.innerHTML = `
                        <tr>
                            <td colspan="5" style="text-align: center; padding: 20px; color: #6b7280;">
                                No orders for this product
                            </td>
                        </tr>
                    `;
                    return;
                }
                
                tbody.innerHTML = orders.map(order => {
                    const status = order.status || 'default';
                    const statusInfo = this.statusMap[status];
                    
                    return `
                        <tr>
                            <td>${order.order_number}</td>
                            <td>${order.order_quantity}</td>
                            <td>${order.delivery_date}</td>
                            <td>
                                <span class="status-indicator status-${status}" 
                                      data-order-id="${order.id}"
                                      data-current-status="${status}"
                                      onclick="ediDashboard.handleStatusClick(this)"
                                      onmousedown="ediDashboard.handleStatusMouseDown(this)"
                                      onmouseup="ediDashboard.handleStatusMouseUp(this)"
                                      onmouseleave="ediDashboard.handleStatusMouseUp(this)">
                                    ${statusInfo.label}
                                </span>
                            </td>
                            <td>${order.status_updated_at ? new Date(order.status_updated_at).toLocaleDateString() : 'N/A'}</td>
                        </tr>
                    `;
                }).join('');
            }

            updateProductChart(productCode, orders) {
                const chartCanvas = document.getElementById(`chart-${productCode}`);
                if (!chartCanvas) return;
                
                // Destroy existing chart if it exists
                if (this.charts[productCode]) {
                    this.charts[productCode].destroy();
                }
                
                // Group orders by delivery date and status
                const dateGroups = {};
                
                orders.forEach(order => {
                    const date = order.delivery_date || 'Unknown';
                    if (!dateGroups[date]) {
                        dateGroups[date] = {
                            default: 0,
                            half: 0,
                            'three-quarter': 0,
                            finished: 0,
                            forecast: 0
                        };
                    }
                    
                    const status = order.status || 'default';
                    const quantity = parseInt(order.order_quantity) || 1;
                    dateGroups[date][status] += quantity;
                });

                // Add forecast data
                Object.keys(this.forecasts).forEach(key => {
                    const [forecastProductCode, monthDate] = key.split('-');
                    if (forecastProductCode === productCode) {
                        const quantity = this.forecasts[key];
                        
                        if (quantity > 0) {
                            const date = monthDate;
                            
                            if (!dateGroups[date]) {
                                dateGroups[date] = {
                                    default: 0,
                                    half: 0,
                                    'three-quarter': 0,
                                    finished: 0,
                                    forecast: 0
                                };
                            }
                            
                            dateGroups[date].forecast += quantity;
                        }
                    }
                });

                // Sort dates
                const sortedDates = Object.keys(dateGroups).sort();
                
                // Create chart
                const ctx = chartCanvas.getContext('2d');
                this.charts[productCode] = new Chart(ctx, {
                    type: 'bar',
                    data: {
                        labels: sortedDates,
                        datasets: [
                            {
                                label: 'Forecast',
                                data: sortedDates.map(date => dateGroups[date].forecast),
                                backgroundColor: '#9ca3af',
                                borderColor: '#6b7280',
                                borderWidth: 1
                            },
                            {
                                label: 'Finished',
                                data: sortedDates.map(date => dateGroups[date].finished),
                                backgroundColor: '#10b981',
                                borderColor: '#059669',
                                borderWidth: 1
                            },
                            {
                                label: '3/4 Done',
                                data: sortedDates.map(date => dateGroups[date]['three-quarter']),
                                backgroundColor: '#f97316',
                                borderColor: '#ea580c',
                                borderWidth: 1
                            },
                            {
                                label: '1/2 Done',
                                data: sortedDates.map(date => dateGroups[date].half),
                                backgroundColor: '#fbbf24',
                                borderColor: '#f59e0b',
                                borderWidth: 1
                            },
                            {
                                label: 'Default',
                                data: sortedDates.map(date => dateGroups[date].default),
                                backgroundColor: '#3b82f6',
                                borderColor: '#2563eb',
                                borderWidth: 1
                            }
                        ]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        scales: {
                            x: {
                                stacked: true,
                                title: {
                                    display: true,
                                    text: 'Delivery Date'
                                }
                            },
                            y: {
                                stacked: true,
                                title: {
                                    display: true,
                                    text: 'Quantity'
                                }
                            }
                        },
                        plugins: {
                            legend: {
                                position: 'top',
                            },
                            title: {
                                display: true,
                                text: `${productCode} - Orders (by status) + Forecasts (gray)`
                            }
                        }
                    }
                });
            }

            switchToProduct(productCode) {
                // Update active tab
                document.querySelectorAll('.product-tab').forEach(tab => {
                    tab.classList.remove('active');
                });
                document.querySelector(`[onclick*="${productCode}"]`).classList.add('active');
                
                // Update active content
                document.querySelectorAll('.tab-content').forEach(content => {
                    content.classList.remove('active');
                });
                document.getElementById(`tab-${productCode}`).classList.add('active');
                
                this.activeProductCode = productCode;
            }

            handleStatusMouseDown(element) {
                this.longPressTimer = setTimeout(() => {
                    this.resetOrderStatus(element);
                }, 3000);
            }

            handleStatusMouseUp(element) {
                if (this.longPressTimer) {
                    clearTimeout(this.longPressTimer);
                    this.longPressTimer = null;
                }
            }

            async handleStatusClick(element) {
                const orderId = element.dataset.orderId;
                const currentStatus = element.dataset.currentStatus;
                
                // Determine next status
                const statusOrder = ['default', 'half', 'three-quarter', 'finished'];
                const currentIndex = statusOrder.indexOf(currentStatus);
                const nextStatus = statusOrder[(currentIndex + 1) % statusOrder.length];
                
                await this.updateOrderStatus(orderId, nextStatus, element);
            }

            async resetOrderStatus(element) {
                const orderId = element.dataset.orderId;
                await this.updateOrderStatus(orderId, 'default', element);
            }

            async updateOrderStatus(orderId, newStatus, element) {
                try {
                    const response = await fetch('/edi/update-status', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                            orderId: orderId,
                            status: newStatus
                        })
                    });

                    if (response.ok) {
                        const statusInfo = this.statusMap[newStatus];
                        
                        // Update UI immediately for all instances
                        const allElements = document.querySelectorAll(`[data-order-id="${orderId}"]`);
                        allElements.forEach(el => {
                            el.className = `status-indicator status-${newStatus}`;
                            el.dataset.currentStatus = newStatus;
                            el.textContent = statusInfo.label;
                        });
                        
                        // Update order in local data
                        const orderIndex = this.orders.findIndex(o => o.id == orderId);
                        if (orderIndex !== -1) {
                            this.orders[orderIndex].status = newStatus;
                            this.orders[orderIndex].status_updated_at = new Date().toISOString();
                        }
                        
                        // Update tabs and stats
                        this.updateProductTabs();
                        this.loadStats();
                        
                        this.showMessage(`Order status updated to ${statusInfo.label}`, 'success', 2000);
                    } else {
                        throw new Error('Failed to update status');
                    }
                } catch (error) {
                    this.showMessage('Failed to update order status: ' + error.message, 'error');
                    console.error('Error updating status:', error);
                }
            }

            setupFileUpload() {
                const uploadArea = document.getElementById('uploadArea');
                const fileInput = document.getElementById('fileInput');

                // Drag and drop handlers
                uploadArea.addEventListener('dragover', (e) => {
                    e.preventDefault();
                    uploadArea.classList.add('dragover');
                });

                uploadArea.addEventListener('dragleave', () => {
                    uploadArea.classList.remove('dragover');
                });

                uploadArea.addEventListener('drop', (e) => {
                    e.preventDefault();
                    uploadArea.classList.remove('dragover');
                    const files = e.dataTransfer.files;
                    this.handleFileUpload(files);
                });

                // Click to upload
                uploadArea.addEventListener('click', () => {
                    fileInput.click();
                });

                fileInput.addEventListener('change', (e) => {
                    this.handleFileUpload(e.target.files);
                });
            }

            async handleFileUpload(files) {
                if (files.length === 0) return;

                for (let file of files) {
                    await this.uploadFile(file);
                }
                
                // Refresh data after upload
                await this.loadOrders();
                await this.loadStats();
            }

            async uploadFile(file) {
                try {
                    const formData = new FormData();
                    formData.append('ediFile', file);

                    this.showMessage(`Uploading ${file.name}...`, 'info');

                    const response = await fetch('/edi/upload', {
                        method: 'POST',
                        body: formData
                    });

                    const result = await response.json();

                    if (result.success) {
                        this.showMessage(
                            `✅ ${file.name}: ${result.newRecords} new, ${result.skippedRecords} skipped`, 
                            'success'
                        );
                    } else {
                        this.showMessage(`❌ ${file.name}: ${result.error}`, 'error');
                    }
                } catch (error) {
                    this.showMessage(`❌ Failed to upload ${file.name}: ${error.message}`, 'error');
                }
            }

            showLoading(show) {
                const loading = document.getElementById('loadingIndicator');
                if (loading) {
                    loading.style.display = show ? 'block' : 'none';
                }
            }

            showMessage(message, type, duration = 5000) {
                const container = document.getElementById('messageContainer');
                if (!container) return;

                const messageDiv = document.createElement('div');
                messageDiv.className = `message ${type}`;
                messageDiv.textContent = message;
                
                container.appendChild(messageDiv);
                
                setTimeout(() => {
                    if (messageDiv.parentNode) {
                        messageDiv.parentNode.removeChild(messageDiv);
                    }
                }, duration);
            }

            async showDebugInfo() {
                console.log('🔍 DEBUG INFO:');
                console.log('📊 Orders:', this.orders.length);
                console.log('📈 Forecasts:', Object.keys(this.forecasts).length);
                console.log('📋 Product priority:', this.productPriority);
                console.log('🏷️ Product mappings:', this.productMappings);
                console.log('📊 Charts:', Object.keys(this.charts).length);
                
                alert(`Debug Info:
📊 Orders: ${this.orders.length}
📈 Forecasts: ${Object.keys(this.forecasts).length}
🏷️ Products: ${this.productPriority.length}
📊 Charts: ${Object.keys(this.charts).length}
👤 Active product: ${this.activeProductCode}

Check console for detailed logs.`);
            }

            async logout() {
                try {
                    await fetch('/auth/logout', { method: 'POST' });
                    window.location.href = '/';
                } catch (error) {
                    console.error('Logout error:', error);
                    window.location.href = '/';
                }
            }
        }

        // Create global instance
        const ediDashboard = new EDIDashboard();

        // Global functions
        function loadOrders() {
            ediDashboard.loadOrders();
        }

        function loadChartData() {
            ediDashboard.loadForecastData().then(() => {
                ediDashboard.updateProductTabs();
                ediDashboard.showMessage('Chart data updated successfully', 'success', 2000);
            });
        }

        function showDebugInfo() {
            ediDashboard.showDebugInfo();
        }

        function logout() {
            ediDashboard.logout();
        }

        // Check authentication and redirect if needed
        async function checkAuth() {
            try {
                const response = await fetch('/auth/status');
                const data = await response.json();
                
                if (!data.authenticated) {
                    window.location.href = '/auth/login';
                    return false;
                }
                return true;
            } catch (error) {
                console.error('Auth check failed:', error);
                window.location.href = '/auth/login';
                return false;
            }
        }

        // Initialize on page load
        document.addEventListener('DOMContentLoaded', async function() {
            const isAuthenticated = await checkAuth();
            if (isAuthenticated) {
                ediDashboard.initialize();
            }
        });
    </script>
</body>
</html>