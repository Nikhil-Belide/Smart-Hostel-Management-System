package com.hostel.module.gatepass;

import com.google.zxing.BarcodeFormat;
import com.google.zxing.EncodeHintType;
import com.google.zxing.WriterException;
import com.google.zxing.client.j2se.MatrixToImageWriter;
import com.google.zxing.common.BitMatrix;
import com.google.zxing.qrcode.QRCodeWriter;
import com.google.zxing.qrcode.decoder.ErrorCorrectionLevel;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.util.HashMap;
import java.util.Map;

@Service
@Slf4j
public class QRCodeService {

    private static final int QR_SIZE = 300;
    private static final String QR_FORMAT = "PNG";
    private static final String QR_PREFIX = "HOSTEL-GP";

    /**
     * Generates a QR code PNG image.
     *
     * @param content The string to encode in the QR
     * @return PNG image as byte array
     */
    public byte[] generateQRCode(String content) throws WriterException, IOException {
        Map<EncodeHintType, Object> hints = new HashMap<>();
        hints.put(EncodeHintType.ERROR_CORRECTION, ErrorCorrectionLevel.H);
        hints.put(EncodeHintType.MARGIN, 2);
        hints.put(EncodeHintType.CHARACTER_SET, "UTF-8");

        QRCodeWriter writer = new QRCodeWriter();
        BitMatrix matrix = writer.encode(content, BarcodeFormat.QR_CODE, QR_SIZE, QR_SIZE, hints);

        ByteArrayOutputStream out = new ByteArrayOutputStream();
        MatrixToImageWriter.writeToStream(matrix, QR_FORMAT, out);
        return out.toByteArray();
    }

    /**
     * Builds the QR content string to be encoded.
     * Format: HOSTEL-GP|{gatepassId}|{token}
     */
    public String buildQRContent(Long gatepassId, String token) {
        return String.format("%s|%d|%s", QR_PREFIX, gatepassId, token);
    }

    /**
     * Parses and validates the scanned QR content.
     *
     * @return String[] { gatepassId, token } or null if invalid
     */
    public String[] parseQRContent(String content) {
        if (content == null || !content.startsWith(QR_PREFIX + "|")) {
            return null;
        }
        String[] parts = content.split("\\|");
        if (parts.length != 3) return null;
        return new String[]{parts[1], parts[2]};
    }
}
