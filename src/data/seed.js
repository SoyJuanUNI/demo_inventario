export const seed = {
  users: [
    { id: 'u_admin', username: 'admin', password: 'admin', name: 'Admin', role: 'adminBar' },
    { id: 'u_emp1', username: 'empleado', password: '1234', name: 'Empleado 1', role: 'empleadoBar' },
  ],
  categories: [
    { id: 'c_beb', name: 'Bebidas', description: 'Bebidas alcohólicas y no alcohólicas' },
    { id: 'c_com', name: 'Comidas', description: 'Platos principales y snacks' },
    { id: 'c_otr', name: 'Otros', description: 'Productos complementarios' },
  ],
  products: [
    { 
      id: 'p_aguila', 
      name: 'Cerveza Águila', 
      category: 'c_beb', 
      price: 6000, 
      stock: 24, 
      lowStock: 8,
      happyHourDiscount: 15,
      happyHourStart: 17,
      happyHourEnd: 19,
      happyHourActive: false,
      image: '/images/products/aguila.png'
    },
    { 
      id: 'p_poker', 
      name: 'Cerveza Poker', 
      category: 'c_beb', 
      price: 6000, 
      stock: 24, 
      lowStock: 8,
      happyHourDiscount: 15,
      happyHourStart: 17,
      happyHourEnd: 19,
      happyHourActive: false,
      image: '/images/products/poker.jpg'
    },
    { 
      id: 'p_club', 
      name: 'Club Colombia', 
      category: 'c_beb', 
      price: 8000, 
      stock: 18, 
      lowStock: 6,
      happyHourDiscount: 20,
      happyHourStart: 17,
      happyHourEnd: 19,
      happyHourActive: false,
      image: '/images/products/club.jpg'
    },
    { 
      id: 'p_agua', 
      name: 'Agua', 
      category: 'c_beb', 
      price: 4000, 
      stock: 20, 
      lowStock: 6,
      happyHourDiscount: 0,
      happyHourStart: 0,
      happyHourEnd: 0,
      happyHourActive: false,
      image: '/images/products/agua.jpg'
    },

    { 
      id: 'p_emp', 
      name: 'Empanada', 
      category: 'c_com', 
      price: 2500, 
      stock: 50, 
      lowStock: 10,
      happyHourDiscount: 10,
      happyHourStart: 15,
      happyHourEnd: 17,
      happyHourActive: false,
      image: '/images/products/empanada.png'
    },
    { 
      id: 'p_sal', 
      name: 'Salchipapa', 
      category: 'c_com', 
      price: 12000, 
      stock: 10, 
      lowStock: 4,
      happyHourDiscount: 25,
      happyHourStart: 15,
      happyHourEnd: 17,
      happyHourActive: false,
      image: '/images/products/salchipapa.jpg'
    },
    { 
      id: 'p_per', 
      name: 'Perro Caliente', 
      category: 'c_com', 
      price: 10000, 
      stock: 12, 
      lowStock: 4,
      happyHourDiscount: 20,
      happyHourStart: 15,
      happyHourEnd: 17,
      happyHourActive: false,
      image: '/images/products/perro.png'
    },

    { 
      id: 'p_hielo', 
      name: 'Hielo', 
      category: 'c_otr', 
      price: 2000, 
      stock: 30, 
      lowStock: 8,
      happyHourDiscount: 0,
      happyHourStart: 0,
      happyHourEnd: 0,
      happyHourActive: false,
      image: '/images/products/hielo.jpg'
    },
  ],
  orders: [
    {
      id: 'ord_demo_mesa1',
      name: 'Mesa 1',
      items: [
        {
          id: 'item_1',
          productId: 'p_aguila',
          qty: 2,
          price: 6000,
          originalPrice: 6000,
          notes: '',
          discount: 0
        },
        {
          id: 'item_2', 
          productId: 'p_empanada',
          qty: 3,
          price: 8000,
          originalPrice: 8000,
          notes: 'Extra salsa',
          discount: 0
        },
        {
          id: 'item_3',
          productId: 'p_salchipapa',
          qty: 1,
          price: 22000,
          originalPrice: 22000,
          notes: '',
          discount: 0
        }
      ],
      status: 'open',
      createdAt: new Date().toISOString(),
      createdBy: 'u_emp1',
      notes: 'Mesa junto a la ventana'
    },
    {
      id: 'ord_demo_mesa2',
      name: 'Mesa 2', 
      items: [
        {
          id: 'item_4',
          productId: 'p_club',
          qty: 1,
          price: 8000,
          originalPrice: 8000,
          notes: 'Bien fría',
          discount: 0
        },
        {
          id: 'item_5',
          productId: 'p_agua',
          qty: 2,
          price: 3000,
          originalPrice: 3000,
          notes: '',
          discount: 0
        }
      ],
      status: 'open',
      createdAt: new Date().toISOString(),
      createdBy: 'u_emp1',
      notes: ''
    }
  ],
  auditLogs: [],
  ui: {
    employeeTargetOrderId: '',
    tableDensity: 'comfortable', // 'compact' | 'comfortable'
    allowDuplicateTableNames: true, // Permitir nombres de mesa duplicados
    rememberSession: false, // Recordar sesión en localStorage
    persistentStorage: false // Estado actual de persistencia
  },
}
