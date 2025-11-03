const QRCode = require('qrcode');

/**
 * Generate QR code for a request
 */
async function generateQRCode(requestId, studentId, requestData) {
  try {
    const qrData = {
      requestId: requestId.toString(),
      studentId: studentId.toString(),
      type: requestData.type,
      destination: requestData.destination,
      departureTime: requestData.departureTime,
      returnTime: requestData.returnTime,
      timestamp: new Date().toISOString()
    };

    const qrString = JSON.stringify(qrData);
    const qrCode = await QRCode.toDataURL(qrString);
    
    // Generate a unique QR code ID
    const qrCodeId = `QR${Date.now()}${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
    
    return {
      qrCodeId,
      qrCodeData: qrString,
      qrCodeImage: qrCode
    };
  } catch (error) {
    console.error('Error generating QR code:', error);
    throw error;
  }
}

module.exports = {
  generateQRCode
};

