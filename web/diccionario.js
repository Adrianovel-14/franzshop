/* DICCIONARIO DEL BUSCADOR
   -----------------------
   Sirve para que el buscador entienda las palabras que usa la gente aunque en la tienda el producto se llame distinto.
   Una línea por palabra, entre comillas simples y con coma al final:

     'lo que escribe el cliente = cómo se llama en la tienda',

   Ejemplos:
     'chicharra = llave ratchet',      → quien busca "chicharra" encuentra las llaves ratchet
     'kit = combo, set',               → la coma separa opciones: "kit" encuentra combos Y sets

   No hace falta poner plurales ni tildes: "chicharras" y "chicharrá" ya funcionan.
   Al armar la tienda se avisa si alguna palabra de la derecha no aparece en ningún producto.
   Las líneas que empiezan con // no cuentan.
*/
window.FS_DICCIONARIO = [
  // Llaves y dados
  'chicharra = ratchet',
  'matraca = ratchet',
  'rachet = ratchet',
  'copas = dados',
  'copa = dados',
  'llave de torque = torquimetro',

  // Pulir, cortar, lijar
  'esmeril = amoladora',
  'esmeriladora = amoladora',
  'galletera = amoladora',
  'moladora = amoladora',
  'pulidora = amoladora, pulidora',
  'serrucho electrico = sierra sable, caladora',
  'sierra de cadena = motosierra',
  'mototool = dremel',
  'minitorno = dremel',
  'rebajadora = router',
  'fresadora = router',
  'lija = lijadora, lijas',

  // Perforar y atornillar
  'desarmador = destornillador, atornillador',
  'destornillador electrico = atornillador',
  'pistola de impacto = llave de impacto',
  'martillo electrico = rotomartillo, demoledor',
  'rompedor = demoledor',
  'rompepavimento = demoledor',
  'mechas = brocas',
  'mecha = brocas',

  // Soldar y calor
  'soldadora = maquina de soldar, soldar',
  'maquina de soldar = soldar',
  'soldador = soldar, cautin',
  'decapador = calor',
  'termofusora = termofusion',

  // Limpieza, aire, agua
  'karcher = hidrolavadora',
  'lavadora a presion = hidrolavadora',
  'compresor = compresora',
  'soplador = sopladora',

  // Medición
  'tester = multitester',
  'multimetro = multitester',
  'cinta metrica = wincha',
  'flexometro = wincha',
  'metro = wincha',

  // Cargar y guardar
  'pila = bateria',
  'pilas = bateria',
  'caja de herramientas = maletin, maleta',
  'juego = set',
  'kit = combo, set',
  'grapadora = engrapadora',
  'clavadora = clavos',
];
