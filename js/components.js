const Components = {
  renderMetricCard(metric, index) {
    const icons = {
      total: '📦',
      inStock: '✅',
      pendingInbound: '📥',
      pendingOutbound: '📤'
    };

    const titles = {
      total: '库存总量',
      inStock: '在库货品',
      pendingInbound: '待入库',
      pendingOutbound: '待出库'
    };

    const trends = {
      total: { value: '+12.5%', direction: 'up' },
      inStock: { value: '+8.3%', direction: 'up' },
      pendingInbound: { value: '-3.2%', direction: 'down' },
      pendingOutbound: { value: '+5.7%', direction: 'up' }
    };

    const trend = trends[metric.type];

    return `
      <div class="metric-card animate-fade-in stagger-${index + 1}" data-metric="${metric.type}">
        <div class="metric-icon ${metric.type === 'inStock' ? 'instock' : (metric.type === 'pendingInbound' ? 'pending' : (metric.type === 'pendingOutbound' ? 'outbound' : 'total'))}">
          ${icons[metric.type]}
        </div>
        <div class="metric-title">${titles[metric.type]}</div>
        <div class="metric-value" data-value="${metric.value}">${Utils.formatNumber(metric.value)}</div>
        <div class="metric-trend ${trend.direction}">
          <span>${trend.direction === 'up' ? '↑' : '↓'}</span>
          <span>${trend.value} 较上周</span>
        </div>
      </div>
    `;
  },

  renderHeatmap(heatmapData) {
    const cells = [];
    const values = Object.values(heatmapData);
    const maxQuantity = Math.max(...values.map(v => v.quantity));
    const minQuantity = Math.min(...values.map(v => v.quantity));

    for (let row = 0; row < 6; row++) {
      for (let col = 0; col < 8; col++) {
        const location = `${String.fromCharCode(65 + row)}${col + 1}`;
        const data = heatmapData[location] || { items: 0, quantity: 0 };
        const colorInfo = Utils.getColorForValue(data.quantity, minQuantity, maxQuantity);

        cells.push(`
          <div class="heatmap-cell"
               style="background: ${colorInfo.bg}; color: ${colorInfo.text};"
               data-location="${location}">
            ${data.items > 0 ? data.items : ''}
            <div class="tooltip">
              <strong>${location}</strong><br>
              货品数: ${data.items}<br>
              总数量: ${data.quantity}
            </div>
          </div>
        `);
      }
    }

    return `
      <div class="heatmap-container">
        <div class="heatmap-grid">
          ${cells.join('')}
        </div>
        <div class="heatmap-legend">
          <span>低密度</span>
          <div class="legend-gradient"></div>
          <span>高密度</span>
        </div>
      </div>
    `;
  },

  renderActivityFeed(activities) {
    if (activities.length === 0) {
      return `
        <div class="empty-state">
          <div class="empty-state-icon">📋</div>
          <div class="empty-state-title">暂无活动</div>
          <div class="empty-state-text">最近24小时内暂无操作记录</div>
        </div>
      `;
    }

    const items = activities.slice(0, 20).map(activity => `
      <div class="activity-item">
        <div class="activity-icon ${activity.type}">
          ${activity.icon}
        </div>
        <div class="activity-content">
          <div class="activity-message">
            <strong>${activity.user}</strong> ${activity.message} <strong>${activity.item}</strong>
            ${activity.quantity > 0 ? ` × ${activity.quantity}` : ''}
          </div>
          <div class="activity-time">${Utils.formatRelativeTime(activity.timestamp)}</div>
        </div>
      </div>
    `).join('');

    return `<div class="activity-list">${items}</div>`;
  },

  renderDataTable(items, pagination) {
    const headers = [
      { key: 'sku', label: 'SKU编号', sortable: true },
      { key: 'name', label: '商品名称', sortable: true },
      { key: 'category', label: '分类', sortable: true },
      { key: 'quantity', label: '数量', sortable: true },
      { key: 'location', label: '存放位置', sortable: true },
      { key: 'status', label: '状态', sortable: true },
      { key: 'actions', label: '操作', sortable: false }
    ];

    const headerCells = headers.map(header => {
      const sortIcon = Store.filters.sortBy === header.key ?
        (Store.filters.sortOrder === 'asc' ? '↑' : '↓') : '↕';
      const sortedClass = Store.filters.sortBy === header.key ? 'sorted' : '';

      return `
        <th class="${sortedClass}" data-sort="${header.key}" ${header.sortable ? '' : 'data-no-sort'}>
          ${header.label}
          <span class="sort-icon">${sortIcon}</span>
        </th>
      `;
    }).join('');

    if (items.length === 0) {
      return `
        <div class="empty-state">
          <div class="empty-state-icon">📦</div>
          <div class="empty-state-title">暂无数据</div>
          <div class="empty-state-text">当前筛选条件下没有找到匹配的货品</div>
        </div>
      `;
    }

    const rows = items.map(item => {
      const quantityClass = item.status === 'outofstock' ? 'low' :
                          (item.status === 'lowstock' ? 'low' : 'normal');

      return `
        <tr data-id="${item.id}">
          <td class="sku-cell">${item.sku}</td>
          <td class="name-cell">${item.name}</td>
          <td>
            <span class="category-badge ${item.category}">
              ${Utils.getCategoryName(item.category)}
            </span>
          </td>
          <td class="quantity-cell ${quantityClass}">${item.quantity}</td>
          <td class="location-cell">${item.location}</td>
          <td>
            <span class="status-badge ${item.status}">
              ${Utils.getStatusName(item.status)}
            </span>
          </td>
          <td>
            <div class="action-buttons">
              <button class="action-btn" title="编辑" onclick="App.editItem('${item.id}')">
                ✏️
              </button>
              <button class="action-btn danger" title="删除" onclick="App.deleteItem('${item.id}')">
                🗑️
              </button>
            </div>
          </td>
        </tr>
      `;
    }).join('');

    return `
      <div class="data-table-container">
        <table class="data-table">
          <thead>
            <tr>
              ${headerCells}
            </tr>
          </thead>
          <tbody>
            ${rows}
          </tbody>
        </table>
      </div>
      ${this.renderPagination(pagination)}
    `;
  },

  renderPagination(pagination) {
    const { total, totalPages, currentPage } = pagination;
    const start = (currentPage - 1) * Store.filters.itemsPerPage + 1;
    const end = Math.min(currentPage * Store.filters.itemsPerPage, total);

    let pages = [];
    const maxVisible = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisible / 2));
    let endPage = Math.min(totalPages, startPage + maxVisible - 1);

    if (endPage - startPage < maxVisible - 1) {
      startPage = Math.max(1, endPage - maxVisible + 1);
    }

    if (startPage > 1) {
      pages.push(1);
      if (startPage > 2) pages.push('...');
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }

    if (endPage < totalPages) {
      if (endPage < totalPages - 1) pages.push('...');
      pages.push(totalPages);
    }

    const pageButtons = pages.map(page => {
      if (page === '...') {
        return `<span class="page-btn" style="cursor: default;">...</span>`;
      }
      return `
        <button class="page-btn ${page === currentPage ? 'active' : ''}"
                onclick="App.changePage(${page})">
          ${page}
        </button>
      `;
    }).join('');

    return `
      <div class="pagination-container">
        <div class="pagination-info">
          显示 ${start}-${end} 条，共 ${total} 条
        </div>
        <div class="pagination-controls">
          <button class="page-btn" onclick="App.changePage(${currentPage - 1})"
                  ${currentPage === 1 ? 'disabled' : ''}>
            ←
          </button>
          ${pageButtons}
          <button class="page-btn" onclick="App.changePage(${currentPage + 1})"
                  ${currentPage === totalPages ? 'disabled' : ''}>
            →
          </button>
        </div>
      </div>
    `;
  },

  renderModal(type, data = null) {
    const titles = {
      inbound: '📥 入库操作',
      outbound: '📤 出库操作',
      add: '➕ 新增货品',
      edit: '✏️ 编辑货品',
      transfer: '🔄 调拨操作'
    };

    const categories = [
      { value: 'electronics', label: '电子产品' },
      { value: 'clothing', label: '服装鞋帽' },
      { value: 'food', label: '食品饮料' },
      { value: 'tools', label: '工具五金' },
      { value: 'other', label: '其他商品' }
    ];

    const locations = [];
    for (let row = 1; row <= 6; row++) {
      for (let col = 1; col <= 8; col++) {
        locations.push(`${String.fromCharCode(64 + row)}${col}`);
      }
    }

    let formContent = '';

    if (type === 'add' || type === 'edit') {
      formContent = `
        <div class="form-group">
          <label class="form-label">商品名称 *</label>
          <input type="text" class="form-input" id="item-name"
                 value="${data ? data.name : ''}"
                 placeholder="请输入商品名称">
        </div>

        <div class="form-row">
          <div class="form-group">
            <label class="form-label">商品分类 *</label>
            <select class="form-select" id="item-category">
              <option value="">请选择分类</option>
              ${categories.map(c => `
                <option value="${c.value}" ${data && data.category === c.value ? 'selected' : ''}>
                  ${c.label}
                </option>
              `).join('')}
            </select>
          </div>

          <div class="form-group">
            <label class="form-label">存放位置 *</label>
            <select class="form-select" id="item-location">
              <option value="">请选择位置</option>
              ${locations.map(loc => `
                <option value="${loc}" ${data && data.location === loc ? 'selected' : ''}>
                  ${loc}
                </option>
              `).join('')}
            </select>
          </div>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label class="form-label">数量 *</label>
            <input type="number" class="form-input" id="item-quantity"
                   value="${data ? data.quantity : ''}"
                   placeholder="0" min="0">
          </div>

          <div class="form-group">
            <label class="form-label">最低库存</label>
            <input type="number" class="form-input" id="item-minstock"
                   value="${data ? data.minStock : '20'}"
                   placeholder="20" min="0">
          </div>
        </div>
      `;
    } else if (type === 'inbound') {
      formContent = `
        <div class="form-group">
          <label class="form-label">商品 SKU *</label>
          <select class="form-select" id="inbound-sku">
            <option value="">请选择商品</option>
            ${Store.inventory.map(item => `
              <option value="${item.id}">${item.sku} - ${item.name}</option>
            `).join('')}
          </select>
        </div>

        <div class="form-group">
          <label class="form-label">入库数量 *</label>
          <input type="number" class="form-input" id="inbound-quantity"
                 placeholder="请输入数量" min="1">
        </div>

        <div class="form-group">
          <label class="form-label">备注</label>
          <input type="text" class="form-input" id="inbound-note"
                 placeholder="可选备注信息">
        </div>
      `;
    } else if (type === 'outbound') {
      formContent = `
        <div class="form-group">
          <label class="form-label">商品 SKU *</label>
          <select class="form-select" id="outbound-sku">
            <option value="">请选择商品</option>
            ${Store.inventory.filter(item => item.quantity > 0).map(item => `
              <option value="${item.id}">${item.sku} - ${item.name} (库存: ${item.quantity})</option>
            `).join('')}
          </select>
        </div>

        <div class="form-group">
          <label class="form-label">出库数量 *</label>
          <input type="number" class="form-input" id="outbound-quantity"
                 placeholder="请输入数量" min="1">
        </div>

        <div class="form-group">
          <label class="form-label">目的地/用途</label>
          <input type="text" class="form-input" id="outbound-destination"
                 placeholder="请输入目的地或用途">
        </div>
      `;
    } else if (type === 'transfer') {
      formContent = `
        <div class="form-group">
          <label class="form-label">商品 SKU *</label>
          <select class="form-select" id="transfer-sku">
            <option value="">请选择商品</option>
            ${Store.inventory.map(item => `
              <option value="${item.id}">${item.sku} - ${item.name} (当前: ${item.location})</option>
            `).join('')}
          </select>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label class="form-label">当前位置</label>
            <input type="text" class="form-input" id="transfer-from" readonly
                   placeholder="当前货架位置">
          </div>

          <div class="form-group">
            <label class="form-label">目标位置 *</label>
            <select class="form-select" id="transfer-to">
              <option value="">请选择目标位置</option>
              ${locations.map(loc => `
                <option value="${loc}">${loc}</option>
              `).join('')}
            </select>
          </div>
        </div>
      `;
    }

    return `
      <div class="modal-overlay" id="modal-overlay">
        <div class="modal">
          <div class="modal-header">
            <h2 class="modal-title">${titles[type]}</h2>
            <button class="modal-close" onclick="App.closeModal()">✕</button>
          </div>
          <div class="modal-body">
            ${formContent}
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary" onclick="App.closeModal()">取消</button>
            <button class="btn btn-primary" onclick="App.submitModal('${type}', ${data ? `'${data.id}'` : 'null'})">
              确认${type === 'add' ? '添加' : (type === 'edit' ? '保存' : '提交')}
            </button>
          </div>
        </div>
      </div>
    `;
  },

  renderQuickActions() {
    return `
      <div class="quick-actions">
        <button class="quick-action-btn" onclick="App.showModal('inbound')">
          <span class="icon">📥</span>
          <span>入库</span>
        </button>
        <button class="quick-action-btn" onclick="App.showModal('outbound')">
          <span class="icon">📤</span>
          <span>出库</span>
        </button>
        <button class="quick-action-btn" onclick="App.showModal('transfer')">
          <span class="icon">🔄</span>
          <span>调拨</span>
        </button>
        <button class="quick-action-btn" onclick="App.showModal('add')">
          <span class="icon">➕</span>
          <span>新增货品</span>
        </button>
      </div>
    `;
  },

  renderFilters() {
    const categories = [
      { value: 'all', label: '全部分类' },
      { value: 'electronics', label: '电子产品' },
      { value: 'clothing', label: '服装鞋帽' },
      { value: 'food', label: '食品饮料' },
      { value: 'tools', label: '工具五金' },
      { value: 'other', label: '其他商品' }
    ];

    const statuses = [
      { value: 'all', label: '全部状态' },
      { value: 'instock', label: '库存充足' },
      { value: 'lowstock', label: '库存不足' },
      { value: 'outofstock', label: '已售罄' }
    ];

    return `
      <div class="inventory-header">
        <div class="search-box">
          <span class="search-icon">🔍</span>
          <input type="text" class="search-input" id="search-input"
                 placeholder="搜索 SKU 或商品名称..."
                 value="${Store.filters.search}">
        </div>

        <div class="filter-group">
          <select class="filter-select" id="filter-category">
            ${categories.map(c => `
              <option value="${c.value}" ${Store.filters.category === c.value ? 'selected' : ''}>
                ${c.label}
              </option>
            `).join('')}
          </select>

          <select class="filter-select" id="filter-status">
            ${statuses.map(s => `
              <option value="${s.value}" ${Store.filters.status === s.value ? 'selected' : ''}>
                ${s.label}
              </option>
            `).join('')}
          </select>
        </div>
      </div>
    `;
  },

  animateNumbers() {
    const metrics = document.querySelectorAll('.metric-value[data-value]');
    metrics.forEach(el => {
      const targetValue = parseInt(el.dataset.value);
      const startValue = 0;
      Utils.animateValue(el, startValue, targetValue, 800);
    });
  }
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = Components;
}
