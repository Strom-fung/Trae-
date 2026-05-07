const App = {
  init() {
    Store.init();
    this.render();
    this.bindEvents();
    setTimeout(() => {
      Components.animateNumbers();
    }, 100);
  },

  render() {
    this.renderMetrics();
    this.renderHeatmap();
    this.renderActivityFeed();
    this.renderInventory();
  },

  renderMetrics() {
    const metricsGrid = document.getElementById('metrics-grid');
    if (!metricsGrid) return;

    const metrics = Store.getMetrics();
    const metricsData = [
      { type: 'total', value: metrics.total },
      { type: 'inStock', value: metrics.inStock },
      { type: 'pendingInbound', value: metrics.pendingInbound },
      { type: 'pendingOutbound', value: metrics.pendingOutbound }
    ];

    metricsGrid.innerHTML = metricsData.map((metric, index) =>
      Components.renderMetricCard(metric, index)
    ).join('');
  },

  renderHeatmap() {
    const heatmapContainer = document.getElementById('heatmap-container');
    if (!heatmapContainer) return;

    const heatmapData = Store.getHeatmapData();
    heatmapContainer.innerHTML = Components.renderHeatmap(heatmapData);
  },

  renderActivityFeed() {
    const activityContainer = document.getElementById('activity-container');
    if (!activityContainer) return;

    activityContainer.innerHTML = Components.renderActivityFeed(Store.activities);
  },

  renderInventory() {
    const inventorySection = document.getElementById('inventory-section');
    if (!inventorySection) return;

    const filtersHtml = Components.renderFilters();
    const quickActionsHtml = Components.renderQuickActions();

    const pagination = Store.getPaginatedInventory();
    const tableHtml = Components.renderDataTable(pagination.items, pagination);

    inventorySection.innerHTML = `
      <div class="inventory-header">
        <h3 class="section-title">库存管理</h3>
      </div>
      ${quickActionsHtml}
      ${filtersHtml}
      ${tableHtml}
    `;

    this.bindInventoryEvents();
  },

  bindEvents() {
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        this.closeModal();
      }
    });

    const modalOverlay = document.getElementById('modal-overlay');
    if (modalOverlay) {
      modalOverlay.addEventListener('click', (e) => {
        if (e.target === modalOverlay) {
          this.closeModal();
        }
      });
    }
  },

  bindInventoryEvents() {
    const searchInput = document.getElementById('search-input');
    const categoryFilter = document.getElementById('filter-category');
    const statusFilter = document.getElementById('filter-status');

    if (searchInput) {
      searchInput.addEventListener('input', Utils.debounce((e) => {
        Store.filters.search = e.target.value;
        Store.filters.currentPage = 1;
        this.updateTable();
      }, 300));
    }

    if (categoryFilter) {
      categoryFilter.addEventListener('change', (e) => {
        Store.filters.category = e.target.value;
        Store.filters.currentPage = 1;
        this.updateTable();
      });
    }

    if (statusFilter) {
      statusFilter.addEventListener('change', (e) => {
        Store.filters.status = e.target.value;
        Store.filters.currentPage = 1;
        this.updateTable();
      });
    }

    const tableHeaders = document.querySelectorAll('.data-table th[data-sort]');
    tableHeaders.forEach(th => {
      th.addEventListener('click', () => {
        const sortKey = th.dataset.sort;
        if (Store.filters.sortBy === sortKey) {
          Store.filters.sortOrder = Store.filters.sortOrder === 'asc' ? 'desc' : 'asc';
        } else {
          Store.filters.sortBy = sortKey;
          Store.filters.sortOrder = 'asc';
        }
        this.updateTable();
      });
    });
  },

  updateTable() {
    const tableContainer = document.querySelector('.data-table-container');
    if (!tableContainer) return;

    const pagination = Store.getPaginatedInventory();
    tableContainer.innerHTML = Components.renderDataTable(pagination.items, pagination).replace(
      /<div class="pagination-container">[\s\S]*<\/div>\s*$/,
      ''
    );

    const paginationContainer = document.querySelector('.pagination-container');
    if (paginationContainer) {
      const newPagination = Components.renderPagination(pagination);
      paginationContainer.outerHTML = newPagination;
    }

    this.bindInventoryEvents();
  },

  showModal(type, data = null) {
    const existingModal = document.getElementById('modal-overlay');
    if (existingModal) {
      existingModal.remove();
    }

    const modalHtml = Components.renderModal(type, data);
    document.body.insertAdjacentHTML('beforeend', modalHtml);

    requestAnimationFrame(() => {
      const modal = document.getElementById('modal-overlay');
      if (modal) {
        modal.classList.add('active');
      }
    });

    if (type === 'transfer') {
      const skuSelect = document.getElementById('transfer-sku');
      if (skuSelect) {
        skuSelect.addEventListener('change', (e) => {
          const item = Store.inventory.find(i => i.id === e.target.value);
          const fromInput = document.getElementById('transfer-from');
          if (fromInput && item) {
            fromInput.value = item.location;
          }
        });
      }
    }
  },

  closeModal() {
    const modal = document.getElementById('modal-overlay');
    if (modal) {
      modal.classList.remove('active');
      setTimeout(() => {
        modal.remove();
      }, 200);
    }
  },

  submitModal(type, itemId = null) {
    let success = false;
    let message = '';

    if (type === 'add') {
      const name = document.getElementById('item-name')?.value.trim();
      const category = document.getElementById('item-category')?.value;
      const quantity = parseInt(document.getElementById('item-quantity')?.value);
      const location = document.getElementById('item-location')?.value;
      const minStock = parseInt(document.getElementById('item-minstock')?.value) || 20;

      if (!name || !category || isNaN(quantity) || !location) {
        Utils.showNotification('请填写所有必填字段', 'error');
        return;
      }

      const newItem = Store.addItem({ name, category, quantity, location, minStock });
      success = true;
      message = `成功添加商品: ${newItem.name}`;

    } else if (type === 'edit' && itemId) {
      const name = document.getElementById('item-name')?.value.trim();
      const category = document.getElementById('item-category')?.value;
      const quantity = parseInt(document.getElementById('item-quantity')?.value);
      const location = document.getElementById('item-location')?.value;
      const minStock = parseInt(document.getElementById('item-minstock')?.value) || 20;

      if (!name || !category || isNaN(quantity) || !location) {
        Utils.showNotification('请填写所有必填字段', 'error');
        return;
      }

      Store.updateItem(itemId, { name, category, quantity, location, minStock });
      success = true;
      message = `成功更新商品: ${name}`;

    } else if (type === 'inbound') {
      const sku = document.getElementById('inbound-sku')?.value;
      const quantity = parseInt(document.getElementById('inbound-quantity')?.value);
      const note = document.getElementById('inbound-note')?.value;

      if (!sku || isNaN(quantity) || quantity <= 0) {
        Utils.showNotification('请选择商品并输入有效的数量', 'error');
        return;
      }

      const item = Store.adjustQuantity(sku, quantity, 'add');
      if (item) {
        Store.addActivity({
          type: 'inbound',
          icon: '📥',
          message: note || '入库',
          item: item.name,
          quantity: quantity,
          location: item.location
        });
        success = true;
        message = `成功入库 ${quantity} 件 ${item.name}`;
      }

    } else if (type === 'outbound') {
      const sku = document.getElementById('outbound-sku')?.value;
      const quantity = parseInt(document.getElementById('outbound-quantity')?.value);
      const destination = document.getElementById('outbound-destination')?.value;

      if (!sku || isNaN(quantity) || quantity <= 0) {
        Utils.showNotification('请选择商品并输入有效的数量', 'error');
        return;
      }

      const item = Store.inventory.find(i => i.id === sku);
      if (item && item.quantity < quantity) {
        Utils.showNotification(`库存不足，当前库存: ${item.quantity}`, 'error');
        return;
      }

      if (item) {
        Store.adjustQuantity(sku, quantity, 'subtract');
        Store.addActivity({
          type: 'outbound',
          icon: '📤',
          message: destination || '出库',
          item: item.name,
          quantity: quantity,
          location: item.location
        });
        success = true;
        message = `成功出库 ${quantity} 件 ${item.name}`;
      }

    } else if (type === 'transfer') {
      const sku = document.getElementById('transfer-sku')?.value;
      const from = document.getElementById('transfer-from')?.value;
      const to = document.getElementById('transfer-to')?.value;

      if (!sku || !to) {
        Utils.showNotification('请选择商品和目标位置', 'error');
        return;
      }

      if (from === to) {
        Utils.showNotification('源位置和目标位置相同，无需调拨', 'warning');
        return;
      }

      const item = Store.updateItem(sku, { location: to });
      if (item) {
        Store.addActivity({
          type: 'transfer',
          icon: '🔄',
          message: `${from} → ${to}`,
          item: item.name,
          quantity: item.quantity,
          location: to
        });
        success = true;
        message = `成功调拨 ${item.name} 从 ${from} 到 ${to}`;
      }
    }

    if (success) {
      Utils.showNotification(message, 'success');
      this.closeModal();
      this.render();
      setTimeout(() => {
        Components.animateNumbers();
      }, 100);
    }
  },

  editItem(id) {
    const item = Store.inventory.find(i => i.id === id);
    if (item) {
      this.showModal('edit', item);
    } else {
      Utils.showNotification('未找到该商品', 'error');
    }
  },

  deleteItem(id) {
    const item = Store.inventory.find(i => i.id === id);
    if (!item) {
      Utils.showNotification('未找到该商品', 'error');
      return;
    }

    if (confirm(`确定要删除商品 "${item.name}" 吗？此操作不可撤销。`)) {
      Store.removeItem(id);
      Utils.showNotification(`已删除商品: ${item.name}`, 'success');
      this.render();
      setTimeout(() => {
        Components.animateNumbers();
      }, 100);
    }
  },

  changePage(page) {
    const pagination = Store.getPaginatedInventory();
    if (page >= 1 && page <= pagination.totalPages) {
      Store.filters.currentPage = page;
      this.updateTable();
    }
  },

  refresh() {
    this.render();
    Utils.showNotification('数据已刷新', 'info');
  }
};

document.addEventListener('DOMContentLoaded', () => {
  App.init();
});

if (typeof module !== 'undefined' && module.exports) {
  module.exports = App;
}
