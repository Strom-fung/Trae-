const Store = {
  inventory: [],
  activities: [],
  filters: {
    search: '',
    category: 'all',
    status: 'all',
    sortBy: 'sku',
    sortOrder: 'asc',
    currentPage: 1,
    itemsPerPage: 20
  },

  init() {
    const savedInventory = localStorage.getItem('inventory');
    const savedActivities = localStorage.getItem('activities');

    if (savedInventory) {
      this.inventory = JSON.parse(savedInventory);
    } else {
      this.inventory = this.generateInitialInventory();
      this.saveInventory();
    }

    if (savedActivities) {
      this.activities = JSON.parse(savedActivities);
    } else {
      this.activities = this.generateInitialActivities();
      this.saveActivities();
    }
  },

  saveInventory() {
    localStorage.setItem('inventory', JSON.stringify(this.inventory));
  },

  saveActivities() {
    localStorage.setItem('activities', JSON.stringify(this.activities));
  },

  generateInitialInventory() {
    const categories = ['electronics', 'clothing', 'food', 'tools', 'other'];
    const categoryNames = {
      electronics: '电子产品',
      clothing: '服装鞋帽',
      food: '食品饮料',
      tools: '工具五金',
      other: '其他商品'
    };

    const items = [];
    const locations = [];

    for (let row = 1; row <= 6; row++) {
      for (let col = 1; col <= 8; col++) {
        locations.push(`${String.fromCharCode(64 + row)}${col}`);
      }
    }

    for (let i = 0; i < 80; i++) {
      const category = categories[Math.floor(Math.random() * categories.length)];
      const location = locations[Math.floor(Math.random() * locations.length)];
      const quantity = Math.floor(Math.random() * 500) + 10;
      const minStock = Math.floor(Math.random() * 50) + 20;

      items.push({
        id: `INV${String(1000 + i).padStart(5, '0')}`,
        sku: `SKU-${category.toUpperCase().substring(0, 3)}-${String(1000 + i).padStart(5, '0')}`,
        name: `${categoryNames[category]} ${String.fromCharCode(65 + Math.floor(Math.random() * 26))}${Math.floor(Math.random() * 100)}`,
        category: category,
        quantity: quantity,
        minStock: minStock,
        location: location,
        status: quantity === 0 ? 'outofstock' : (quantity < minStock ? 'lowstock' : 'instock'),
        lastUpdated: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString()
      });
    }

    return items;
  },

  generateInitialActivities() {
    const activityTypes = [
      { type: 'inbound', icon: '📥', messages: ['入库', '验收入库', '退货入库', '调拨入库'] },
      { type: 'outbound', icon: '📤', messages: ['出库', '订单出库', '调拨出库', '退货出库'] },
      { type: 'transfer', icon: '🔄', messages: ['位置调整', '货架调拨', '区域迁移'] },
      { type: 'adjustment', icon: '✏️', messages: ['库存盘点', '数量调整', '信息更新'] }
    ];

    const activities = [];
    const itemNames = ['iPhone 15 Pro', 'MacBook Air', 'AirPods Pro', 'Nike运动鞋', 'AdidasT恤', '农夫山泉', '可口可乐', '电动螺丝刀', '锤子工具组', '办公桌'];

    for (let i = 0; i < 30; i++) {
      const activityType = activityTypes[Math.floor(Math.random() * activityTypes.length)];
      const item = itemNames[Math.floor(Math.random() * itemNames.length)];
      const quantity = Math.floor(Math.random() * 50) + 1;
      const location = `${String.fromCharCode(65 + Math.floor(Math.random() * 6))}${Math.floor(Math.random() * 8) + 1}`;

      activities.push({
        id: `ACT${String(1000 + i).padStart(5, '0')}`,
        type: activityType.type,
        icon: activityType.icon,
        message: activityType.messages[Math.floor(Math.random() * activityType.messages.length)],
        item: item,
        quantity: quantity,
        location: location,
        timestamp: new Date(Date.now() - i * 3600000 * (Math.random() * 5 + 1)).toISOString(),
        user: Math.random() > 0.5 ? '张伟' : '李娜'
      });
    }

    return activities.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  },

  addItem(item) {
    const newItem = {
      ...item,
      id: `INV${String(this.inventory.length + 1000).padStart(5, '0')}`,
      sku: `SKU-${item.category.toUpperCase().substring(0, 3)}-${String(this.inventory.length + 1000).padStart(5, '0')}`,
      lastUpdated: new Date().toISOString()
    };

    this.inventory.unshift(newItem);
    this.saveInventory();

    this.addActivity({
      type: 'inbound',
      icon: '📥',
      message: '新增商品',
      item: newItem.name,
      quantity: newItem.quantity,
      location: newItem.location
    });

    return newItem;
  },

  updateItem(id, updates) {
    const index = this.inventory.findIndex(item => item.id === id);
    if (index !== -1) {
      this.inventory[index] = {
        ...this.inventory[index],
        ...updates,
        lastUpdated: new Date().toISOString()
      };

      this.inventory[index].status =
        this.inventory[index].quantity === 0 ? 'outofstock' :
        (this.inventory[index].quantity < this.inventory[index].minStock ? 'lowstock' : 'instock');

      this.saveInventory();

      this.addActivity({
        type: 'adjustment',
        icon: '✏️',
        message: '更新商品',
        item: this.inventory[index].name,
        quantity: updates.quantity || this.inventory[index].quantity,
        location: updates.location || this.inventory[index].location
      });

      return this.inventory[index];
    }
    return null;
  },

  removeItem(id) {
    const index = this.inventory.findIndex(item => item.id === id);
    if (index !== -1) {
      const item = this.inventory[index];
      this.inventory.splice(index, 1);
      this.saveInventory();

      this.addActivity({
        type: 'outbound',
        icon: '🗑️',
        message: '删除商品',
        item: item.name,
        quantity: item.quantity,
        location: item.location
      });

      return true;
    }
    return false;
  },

  adjustQuantity(id, quantity, type = 'set') {
    const item = this.inventory.find(item => item.id === id);
    if (item) {
      if (type === 'set') {
        item.quantity = quantity;
      } else if (type === 'add') {
        item.quantity += quantity;
      } else if (type === 'subtract') {
        item.quantity = Math.max(0, item.quantity - quantity);
      }

      item.status =
        item.quantity === 0 ? 'outofstock' :
        (item.quantity < item.minStock ? 'lowstock' : 'instock');

      item.lastUpdated = new Date().toISOString();
      this.saveInventory();

      return item;
    }
    return null;
  },

  addActivity(activity) {
    const newActivity = {
      id: `ACT${String(Date.now()).padStart(5, '0')}`,
      ...activity,
      timestamp: new Date().toISOString(),
      user: '张伟'
    };

    this.activities.unshift(newActivity);

    if (this.activities.length > 100) {
      this.activities = this.activities.slice(0, 100);
    }

    this.saveActivities();
    return newActivity;
  },

  getFilteredInventory() {
    let filtered = [...this.inventory];

    if (this.filters.search) {
      const search = this.filters.search.toLowerCase();
      filtered = filtered.filter(item =>
        item.sku.toLowerCase().includes(search) ||
        item.name.toLowerCase().includes(search)
      );
    }

    if (this.filters.category !== 'all') {
      filtered = filtered.filter(item => item.category === this.filters.category);
    }

    if (this.filters.status !== 'all') {
      filtered = filtered.filter(item => item.status === this.filters.status);
    }

    filtered.sort((a, b) => {
      let aVal = a[this.filters.sortBy];
      let bVal = b[this.filters.sortBy];

      if (typeof aVal === 'string') {
        aVal = aVal.toLowerCase();
        bVal = bVal.toLowerCase();
      }

      if (this.filters.sortOrder === 'asc') {
        return aVal > bVal ? 1 : -1;
      } else {
        return aVal < bVal ? 1 : -1;
      }
    });

    return filtered;
  },

  getPaginatedInventory() {
    const filtered = this.getFilteredInventory();
    const start = (this.filters.currentPage - 1) * this.filters.itemsPerPage;
    const end = start + this.filters.itemsPerPage;

    return {
      items: filtered.slice(start, end),
      total: filtered.length,
      totalPages: Math.ceil(filtered.length / this.filters.itemsPerPage),
      currentPage: this.filters.currentPage
    };
  },

  getMetrics() {
    const totalItems = this.inventory.reduce((sum, item) => sum + item.quantity, 0);
    const inStockItems = this.inventory.filter(item => item.status === 'instock').length;
    const pendingInbound = this.activities.filter(a => a.type === 'inbound' && Date.now() - new Date(a.timestamp).getTime() < 24 * 60 * 60 * 1000).length;
    const pendingOutbound = this.activities.filter(a => a.type === 'outbound' && Date.now() - new Date(a.timestamp).getTime() < 24 * 60 * 60 * 1000).length;

    return {
      total: totalItems,
      inStock: inStockItems,
      pendingInbound: pendingInbound,
      pendingOutbound: pendingOutbound
    };
  },

  getHeatmapData() {
    const heatmap = {};
    const locations = [];

    for (let row = 1; row <= 6; row++) {
      for (let col = 1; col <= 8; col++) {
        locations.push(`${String.fromCharCode(64 + row)}${col}`);
      }
    }

    locations.forEach(loc => {
      const items = this.inventory.filter(item => item.location === loc);
      heatmap[loc] = {
        location: loc,
        items: items.length,
        quantity: items.reduce((sum, item) => sum + item.quantity, 0)
      };
    });

    return heatmap;
  }
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = Store;
}
