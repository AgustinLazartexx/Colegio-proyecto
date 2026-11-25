const baseUrl = typeof import.meta.env === "object" ? import.meta.env.BASE_URL : "/";
export const LOGO_COLEGIO_URL = `${baseUrl}img/Logo.png`;

let logoPromise;

const bytesToBase64 = (bytes) => {
  let binary = "";
  const chunkSize = 0x8000;
  for (let offset = 0; offset < bytes.length; offset += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(offset, offset + chunkSize));
  }
  return btoa(binary);
};

const cargarLogo = async () => {
  const response = await fetch(LOGO_COLEGIO_URL);
  if (!response.ok) {
    throw new Error(`No se pudo cargar el logo institucional (${response.status}).`);
  }

  const arrayBuffer = await response.arrayBuffer();
  const dataUrl = `data:image/png;base64,${bytesToBase64(new Uint8Array(arrayBuffer))}`;
  const image = new Image();
  image.src = dataUrl;
  await image.decode();

  return Object.freeze({
    dataUrl,
    arrayBuffer,
    ancho: image.naturalWidth,
    alto: image.naturalHeight,
    formato: "png",
  });
};

export const obtenerLogoColegio = () => {
  if (!logoPromise) {
    logoPromise = cargarLogo().catch((error) => {
      logoPromise = undefined;
      throw error;
    });
  }
  return logoPromise;
};
