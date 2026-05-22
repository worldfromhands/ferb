/**
 * Mapa cidade -> estado (UF). O Chartmetric entrega cidades, não estados;
 * usamos este lookup para agrupar a audiência brasileira por estado.
 * Cobre as principais cidades de cada UF — expandir conforme necessário.
 */

const cityToState = {
  // SP
  'São Paulo': 'SP', 'Campinas': 'SP', 'Santos': 'SP', 'Ribeirão Preto': 'SP',
  'Sorocaba': 'SP', 'São Bernardo do Campo': 'SP', 'Guarulhos': 'SP',
  'Santo André': 'SP', 'São José dos Campos': 'SP', 'Osasco': 'SP',
  'Jundiaí': 'SP', 'Bauru': 'SP', 'Piracicaba': 'SP', 'São José do Rio Preto': 'SP',
  'Mogi das Cruzes': 'SP', 'Franca': 'SP', 'Limeira': 'SP', 'Indaiatuba': 'SP',
  'Araraquara': 'SP', 'Presidente Prudente': 'SP', 'Diadema': 'SP', 'Carapicuíba': 'SP',
  'Taubaté': 'SP', 'Marília': 'SP',
  // RJ
  'Rio de Janeiro': 'RJ', 'Niterói': 'RJ', 'Nova Iguaçu': 'RJ', 'Duque de Caxias': 'RJ',
  'São Gonçalo': 'RJ', 'Campos dos Goytacazes': 'RJ', 'Petrópolis': 'RJ',
  'Volta Redonda': 'RJ', 'Macaé': 'RJ', 'Belford Roxo': 'RJ', 'São João de Meriti': 'RJ',
  // MG
  'Belo Horizonte': 'MG', 'Uberlândia': 'MG', 'Contagem': 'MG', 'Juiz de Fora': 'MG',
  'Betim': 'MG', 'Montes Claros': 'MG', 'Uberaba': 'MG', 'Ribeirão das Neves': 'MG',
  'Governador Valadares': 'MG', 'Ipatinga': 'MG', 'Sete Lagoas': 'MG',
  'Divinópolis': 'MG', 'Santa Luzia': 'MG', 'Poços de Caldas': 'MG',
  // RS
  'Porto Alegre': 'RS', 'Caxias do Sul': 'RS', 'Pelotas': 'RS', 'Canoas': 'RS',
  'Santa Maria': 'RS', 'Gravataí': 'RS', 'Viamão': 'RS', 'Novo Hamburgo': 'RS',
  'São Leopoldo': 'RS', 'Rio Grande': 'RS', 'Passo Fundo': 'RS',
  // PR
  'Curitiba': 'PR', 'Londrina': 'PR', 'Maringá': 'PR', 'Ponta Grossa': 'PR',
  'Cascavel': 'PR', 'São José dos Pinhais': 'PR', 'Foz do Iguaçu': 'PR',
  'Colombo': 'PR', 'Guarapuava': 'PR',
  // BA
  'Salvador': 'BA', 'Feira de Santana': 'BA', 'Vitória da Conquista': 'BA',
  'Camaçari': 'BA', 'Itabuna': 'BA', 'Juazeiro': 'BA', 'Lauro de Freitas': 'BA',
  'Ilhéus': 'BA',
  // PE
  'Recife': 'PE', 'Caruaru': 'PE', 'Olinda': 'PE', 'Petrolina': 'PE',
  'Jaboatão dos Guararapes': 'PE', 'Paulista': 'PE',
  // CE
  'Fortaleza': 'CE', 'Caucaia': 'CE', 'Juazeiro do Norte': 'CE', 'Maracanaú': 'CE',
  'Sobral': 'CE',
  // SC
  'Florianópolis': 'SC', 'Joinville': 'SC', 'Blumenau': 'SC', 'São José': 'SC',
  'Criciúma': 'SC', 'Chapecó': 'SC', 'Itajaí': 'SC',
  // GO
  'Goiânia': 'GO', 'Aparecida de Goiânia': 'GO', 'Anápolis': 'GO', 'Rio Verde': 'GO',
  // DF
  'Brasília': 'DF', 'Ceilândia': 'DF', 'Taguatinga': 'DF', 'Planaltina': 'DF',
  // AM
  'Manaus': 'AM', 'Parintins': 'AM',
  // PA
  'Belém': 'PA', 'Ananindeua': 'PA', 'Santarém': 'PA', 'Marabá': 'PA',
  // MA
  'São Luís': 'MA', 'Imperatriz': 'MA', 'Caxias': 'MA',
  // PI
  'Teresina': 'PI', 'Parnaíba': 'PI',
  // RN
  'Natal': 'RN', 'Mossoró': 'RN', 'Caicó': 'RN', 'Parnamirim': 'RN',
  // PB
  'João Pessoa': 'PB', 'Campina Grande': 'PB',
  // AL
  'Maceió': 'AL', 'Arapiraca': 'AL',
  // SE
  'Aracaju': 'SE', 'Nossa Senhora do Socorro': 'SE',
  // ES
  'Vitória': 'ES', 'Serra': 'ES', 'Vila Velha': 'ES', 'Cariacica': 'ES',
  // TO
  'Palmas': 'TO', 'Araguaína': 'TO',
  // MT
  'Cuiabá': 'MT', 'Várzea Grande': 'MT', 'Rondonópolis': 'MT',
  // MS
  'Campo Grande': 'MS', 'Dourados': 'MS', 'Três Lagoas': 'MS',
  // RO
  'Porto Velho': 'RO', 'Ji-Paraná': 'RO',
  // AC
  'Rio Branco': 'AC',
  // AP
  'Macapá': 'AP',
  // RR
  'Boa Vista': 'RR',
};

const stateNames = {
  SP: 'São Paulo', RJ: 'Rio de Janeiro', MG: 'Minas Gerais',
  RS: 'Rio Grande do Sul', PR: 'Paraná', BA: 'Bahia',
  PE: 'Pernambuco', CE: 'Ceará', SC: 'Santa Catarina',
  GO: 'Goiás', DF: 'Distrito Federal', AM: 'Amazonas',
  PA: 'Pará', MA: 'Maranhão', PI: 'Piauí', RN: 'Rio Grande do Norte',
  PB: 'Paraíba', AL: 'Alagoas', SE: 'Sergipe', ES: 'Espírito Santo',
  TO: 'Tocantins', MT: 'Mato Grosso', MS: 'Mato Grosso do Sul',
  RO: 'Rondônia', AC: 'Acre', AP: 'Amapá', RR: 'Roraima',
};

/** Resolve o estado de uma cidade (exato, depois case-insensitive). */
function getCityState(cityName) {
  if (!cityName) return null;
  if (cityToState[cityName]) return cityToState[cityName];
  const lower = String(cityName).toLowerCase().trim();
  for (const [city, state] of Object.entries(cityToState)) {
    if (city.toLowerCase() === lower) return state;
  }
  return null;
}

module.exports = { cityToState, stateNames, getCityState };
