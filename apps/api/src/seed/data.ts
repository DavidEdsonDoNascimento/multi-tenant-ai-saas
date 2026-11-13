export const DEMO_PASSWORD = "Senha@123";

interface SeedProduct {
  name: string;
  description: string;
  price: number;
  category: string;
}

interface SeedCompany {
  name: string;
  admin: { name: string; email: string };
  user: { name: string; email: string };
  products: SeedProduct[];
}

export const SEED_COMPANIES: SeedCompany[] = [
  {
    name: "Empresa A - TechStore",
    admin: { name: "Ana Admin (A)", email: "admin@empresa-a.com" },
    user: { name: "Caio Usuário (A)", email: "user@empresa-a.com" },
    products: [
      { name: "Notebook Pro 14", description: "Notebook 14 polegadas, 16 GB de RAM e SSD de 512 GB, ideal para trabalho e estudos.", price: 5499.9, category: "Notebooks" },
      { name: "Notebook Gamer X15", description: "Notebook gamer com placa de vídeo dedicada, tela de 144 Hz e teclado RGB.", price: 8999, category: "Notebooks" },
      { name: "Smartphone Aurora 128GB", description: "Smartphone com tela AMOLED, câmera tripla de 50 MP e bateria de longa duração.", price: 2299.9, category: "Smartphones" },
      { name: "Smartphone Lume Lite", description: "Smartphone de entrada com 64 GB, ótimo custo-benefício para o dia a dia.", price: 899, category: "Smartphones" },
      { name: "Fone Bluetooth NoiseOff", description: "Headphone sem fio com cancelamento ativo de ruído e 30 horas de bateria.", price: 649.9, category: "Áudio" },
      { name: "Caixa de Som Pulse Mini", description: "Caixa de som portátil à prova d'água com 12 horas de reprodução.", price: 249.9, category: "Áudio" },
      { name: "Teclado Mecânico Forge", description: "Teclado mecânico compacto com switches lineares e iluminação RGB.", price: 399.9, category: "Periféricos" },
      { name: "Mouse Sem Fio Glide", description: "Mouse ergonômico sem fio com sensor de 4000 DPI e bateria recarregável.", price: 129.9, category: "Periféricos" },
      { name: "Monitor UltraWide 29\"", description: "Monitor ultrawide de 29 polegadas Full HD com painel IPS.", price: 1599, category: "Monitores" },
      { name: "Monitor 4K Vision 27\"", description: "Monitor 4K de 27 polegadas com cobertura de 99% sRGB para design e edição.", price: 2899.9, category: "Monitores" },
      { name: "Webcam Full HD StreamCam", description: "Webcam 1080p com microfone embutido e foco automático.", price: 279.9, category: "Acessórios" },
      { name: "Hub USB-C 7 em 1", description: "Hub USB-C com HDMI 4K, leitor de cartão SD e três portas USB 3.0.", price: 189.9, category: "Acessórios" },
    ],
  },
  {
    name: "Empresa B - Casa Viva",
    admin: { name: "Bruno Admin (B)", email: "admin@empresa-b.com" },
    user: { name: "Dani Usuária (B)", email: "user@empresa-b.com" },
    products: [
      { name: "Sofá Retrátil 3 Lugares", description: "Sofá retrátil e reclinável em tecido suede, com estrutura de madeira maciça.", price: 3199, category: "Móveis" },
      { name: "Mesa de Jantar Carvalho 6 Lugares", description: "Mesa de jantar em madeira de carvalho com acabamento fosco.", price: 2490, category: "Móveis" },
      { name: "Estante Modular Nórdica", description: "Estante modular com nichos, acabamento branco e pés em madeira.", price: 899.9, category: "Móveis" },
      { name: "Jogo de Panelas Inox 5 Peças", description: "Conjunto de panelas em aço inox com fundo triplo e tampas de vidro.", price: 459.9, category: "Cozinha" },
      { name: "Air Fryer 5L Digital", description: "Fritadeira elétrica sem óleo com painel digital e 8 funções pré-programadas.", price: 399, category: "Cozinha" },
      { name: "Liquidificador Turbo 1200W", description: "Liquidificador de alta potência com jarra de vidro de 2 litros.", price: 219.9, category: "Cozinha" },
      { name: "Luminária de Piso Arco", description: "Luminária de piso em arco com cúpula de tecido e base de mármore.", price: 549, category: "Decoração" },
      { name: "Tapete Geométrico 2x3 m", description: "Tapete de pelo baixo com estampa geométrica, fácil de limpar.", price: 689.9, category: "Decoração" },
      { name: "Kit 3 Vasos Cerâmica", description: "Kit com três vasos de cerâmica em tamanhos diferentes e acabamento fosco.", price: 119.9, category: "Decoração" },
      { name: "Jogo de Cama Queen 400 Fios", description: "Jogo de cama queen em algodão egípcio com 4 peças.", price: 379.9, category: "Cama, Mesa e Banho" },
      { name: "Edredom Dupla Face King", description: "Edredom king size dupla face com enchimento de fibra siliconada.", price: 299.9, category: "Cama, Mesa e Banho" },
      { name: "Aspirador Robô Smart", description: "Aspirador robô com mapeamento, controle por aplicativo e retorno automático à base.", price: 1799.9, category: "Eletrodomésticos" },
    ],
  },
];
