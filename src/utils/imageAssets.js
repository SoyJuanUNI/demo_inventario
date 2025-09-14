// Importaciones de imágenes de productos
import aguaImg from '/images/products/agua.jpg'
import aguilaImg from '/images/products/aguila.png'
import clubImg from '/images/products/club.jpg'
import coronaImg from '/images/products/corona.jpg'
import defaultFoodImg from '/images/products/default-food.svg'
import empanadaImg from '/images/products/empanada.png'
import hieloImg from '/images/products/hielo.jpg'
import perroImg from '/images/products/perro.png'
import pokerImg from '/images/products/poker.jpg'
import salchipapaImg from '/images/products/salchipapa.jpg'

// Mapa de imágenes por nombre de archivo
export const productImages = {
  'agua.jpg': aguaImg,
  'aguila.png': aguilaImg,
  'club.jpg': clubImg,
  'corona.jpg': coronaImg,
  'default-food.svg': defaultFoodImg,
  'empanada.png': empanadaImg,
  'hielo.jpg': hieloImg,
  'perro.png': perroImg,
  'poker.jpg': pokerImg,
  'salchipapa.jpg': salchipapaImg,
}

// Función helper para obtener URL de imagen
export const getProductImageUrl = (imagePath) => {
  if (!imagePath) return defaultFoodImg
  
  // Extraer nombre del archivo de la ruta
  const fileName = imagePath.split('/').pop()
  
  // Devolver imagen importada o fallback
  return productImages[fileName] || defaultFoodImg
}

// Función alternativa para mapeo por ID de producto
export const getImageByProductId = (productId) => {
  const imageMap = {
    'p_agua': aguaImg,
    'p_aguila': aguilaImg,
    'p_club': clubImg,
    'p_corona': coronaImg,
    'p_emp': empanadaImg,
    'p_hielo': hieloImg,
    'p_per': perroImg,
    'p_poker': pokerImg,
    'p_sal': salchipapaImg,
  }
  
  return imageMap[productId] || defaultFoodImg
}