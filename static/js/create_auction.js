let currentInputId = null;

function readURL(input, previewId, iconId) {
    if (input.files && input.files[0]) {
        const reader = new FileReader();
        reader.onload = (e) => {
            document.getElementById(previewId).src = e.target.result;
            document.getElementById(previewId).style.display = 'block';
            document.getElementById(iconId).style.display = 'none';
        };
        reader.readAsDataURL(input.files[0]);
    }
}

// Attach event listener to the main image input
document.getElementById('id_form-0-image').addEventListener('change', () => {
    readURL(document.getElementById('id_form-0-image'), 'main-thumbnail-preview', 'main-upload-icon');
});

// Attach event listeners to all image upload inputs
document.querySelectorAll('input[type="file"][id^="id_form-"]').forEach((input) => {
    const index = input.id.match(/\d+/)[0]; // Extract the index from the input ID
    input.addEventListener('change', () => {
        readURL(input, `thumbnail-preview-${index}`, `upload-icon-${index}`);
    });
});


window.onload = () => {
    document.getElementById('optionModal').style.display = 'block';
    // document.getElementById('optionModal').style.display = 'none';
};

const options = {
    scanQRCode: 'scanModal',
    scanIndividualBarcodes: 'scanBarcodesModal',
    importExcel: 'importModal',
    enterDetails: null // Handle Enter Details Manually option
};

Object.keys(options).forEach(option => {
    document.getElementById(option).onclick = () => {
        document.getElementById('optionModal').style.display = 'none';
        const modalId = options[option];
        if (modalId) document.getElementById(modalId).style.display = 'block';
        if (option === 'scanQRCode') startScanner();
    };
});

['closeScanModal', 'closeScanBarcodesModal', 'closeImportModal'].forEach(id => {
    const closeButton = document.getElementById(id);
    if (closeButton) {
        closeButton.onclick = () => {
            const modalId = id.replace('close', '').toLowerCase();
            const modal = document.getElementById(modalId);
            if (modal) {
                modal.style.display = 'none';
            }
            if (id === 'closeScanModal') stopScanner();
        };
    } else {
        console.error(`Element with ID ${id} not found`);
    }
});

document.getElementById('openScanButton').onclick = () => {
    document.getElementById('importModal').style.display = 'none';
    document.getElementById('scanModal').style.display = 'block';
    startScanner();
};

document.getElementById('fileInput').addEventListener('change', handleFileSelect);
document.getElementById('id_udi').addEventListener('change', (e) => {
    parseBarcode(e.target.value);
});

// function startScanner(inputId = null) {
//     currentInputId = inputId;
//
//     Quagga.init({
//         inputStream: {
//             name: "Live",
//             type: "LiveStream",
//             target: document.querySelector('#video'),
//             constraints: {
//                 facingMode: "environment"
//             }
//         },
//         decoder: {
//             readers: ["code_128_reader", "ean_reader", "ean_8_reader", "code_39_reader", "code_39_vin_reader", "codabar_reader", "upc_reader", "upc_e_reader", "i2of5_reader"]
//         }
//     }, (err) => {
//         if (err) {
//             console.error(err);
//             return;
//         }
//         console.log("QuaggaJS initialized. Ready to start");
//         Quagga.start();
//     });
//
//     Quagga.offDetected(onDetected);
//     Quagga.onDetected(onDetected);
//
//     const video = document.getElementById('video');
//     const canvas = document.getElementById('canvas');
//     const context = canvas.getContext('2d');
//
//     navigator.mediaDevices.getUserMedia({video: {facingMode: "environment"}})
//         .then((stream) => {
//             video.srcObject = stream;
//             video.setAttribute("playsinline", true);
//             video.play();
//             console.log("Video stream started");
//             requestAnimationFrame(tick);
//         })
//         .catch((err) => {
//             console.error("Error accessing the camera: " + err);
//         });
//
//     function tick() {
//         if (video.readyState === video.HAVE_ENOUGH_DATA) {
//             canvas.height = video.videoHeight;
//             canvas.width = video.videoWidth;
//             context.drawImage(video, 0, 0, canvas.width, canvas.height);
//             const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
//             const code = jsQR(imageData.data, imageData.width, imageData.height);
//             if (code) {
//                 console.log("QR code detected: " + code.data);
//                 parseBarcode(code.data);
//                 stopScanner();
//             }
//         }
//         requestAnimationFrame(tick);
//     }
// }
//
// function stopScanner() {
//     Quagga.stop();
//     const video = document.getElementById('video');
//     if (video.srcObject) {
//         video.srcObject.getTracks().forEach(track => track.stop());
//         video.srcObject = null;
//     }
// }
//
// function onDetected(result) {
//     console.log(`Barcode detected and processed : [${result.codeResult.code}]`, result);
//     if (currentInputId) {
//         document.getElementById(currentInputId).value = result.codeResult.code;
//         document.getElementById('scanModal').style.display = 'none';
//         currentInputId = null;
//         parseBarcode(result.codeResult.code);
//     } else {
//         parseBarcode(result.codeResult.code);
//     }
//     stopScanner();
// }

const formatMap = {
    0: 'Aztec',
    1: 'CODABAR',
    2: 'Code 39',
    3: 'Code 93',
    4: 'Code 128',
    5: 'Data Matrix',
    6: 'EAN-8',
    7: 'EAN-13',
    8: 'ITF',
    9: 'MaxiCode',
    10: 'PDF 417',
    11: 'QR Code',
    12: 'RSS 14',
    13: 'RSS Expanded',
    14: 'UPC-A',
    15: 'UPC-E',
    16: 'UPC-EAN Extension'
};

const scannedBarcodes = [];

// document.getElementById('start-scan').addEventListener('click', function () {
//     startScanner();
// });

function startScanner() {
    const codeReader = new ZXing.BrowserMultiFormatReader();
    codeReader.decodeFromVideoDevice(null, 'video', (result, err) => {
        if (result) {
            console.log(result);
            processDetectedBarcode(result);
        }
        if (err && !(err instanceof ZXing.NotFoundException)) {
            console.error(err);
        }
    });

    function processDetectedBarcode(result) {
        const code = result.text;
        const format = formatMap[result.format];

        if (!scannedBarcodes.find(item => item.code === code)) {
            const parsedResult = format === 'QR Code' || format === 'Data Matrix'
                ? parseQRCode(code)
                : parseGS1Barcode(code);

            scannedBarcodes.push({code: code, format: format, parsed: parsedResult});
            displayDetectedBarcode(code, format, parsedResult);
        }
    }

    // function displayDetectedBarcode(code, format, parsedResult) {
    //     const barcodeResults = document.getElementById('barcode-results');
    //     const resultDiv = document.createElement('div');
    //     resultDiv.innerHTML = `<strong>Detected Barcode (${format}):</strong> ${code} <br><strong>Parsed Results:</strong> <pre>${JSON.stringify(parsedResult, null, 2)}</pre>`;
    //     barcodeResults.appendChild(resultDiv);
    // }

    const aiOptions = [
            { label: 'GTIN/UDI', value: '01' },
            { label: 'Batch or Lot Number', value: '10' },
            { label: 'Production Date', value: '11' },
            { label: 'Expiration Date', value: '17' },
            { label: 'Unknown/Not Needed', value: 'Unknown' }
        ];

    function displayDetectedBarcode(code, format, parsedResult) {
        const barcodeResults = document.getElementById('barcode-results');
        const resultDiv = document.createElement('div');
        resultDiv.classList.add('mapping-table');
        // resultDiv.innerHTML = `<strong>Detected Barcode (${format}):</strong> ${code}`;

        for (const [key, value] of Object.entries(parsedResult)) {
            const row = document.createElement('div');
            row.classList.add('mapping-row');

            const leftCell = document.createElement('div');
            leftCell.classList.add('mapping-cell');
            leftCell.innerText = value;

            const arrowCell = document.createElement('div');
            arrowCell.classList.add('arrow');
            arrowCell.innerHTML = `<i class="fa-solid fa-arrow-right"></i>`;

            const rightCell = document.createElement('div');
            rightCell.classList.add('mapping-cell');
            const select = document.createElement('select');
            select.classList.add('form-control');

            aiOptions.forEach(option => {
                const opt = document.createElement('option');
                opt.value = option.value;
                opt.innerText = option.label;
                if (option.label === key) {
                    opt.selected = true;
                }
                select.appendChild(opt);
            });

            rightCell.appendChild(select);
            row.appendChild(leftCell);
            row.appendChild(arrowCell);
            row.appendChild(rightCell);

            resultDiv.appendChild(row);
        }

        barcodeResults.appendChild(resultDiv);

        // Save the structured data in the JSON variable
        // structuredData.push(parsedResult);
        // console.log('Structured Data:', JSON.stringify(structuredData, null, 2));
    }


    function parseQRCode(code) {
        const sanitizedCode = code.replace(/[^ -~]+/g, ""); // Remove non-printable ASCII characters
        const aiPatterns = {
            "01": "GTIN",
            "10": "Batch or Lot Number",
            "11": "Production Date",
            "17": "Expiration Date",
            // Add more AI patterns as needed
        };
        const parsedResult = {};
        let remainingCode = sanitizedCode;
        while (remainingCode.length > 0) {
            const ai = remainingCode.substring(0, 2);
            if (aiPatterns[ai]) {
                const field = aiPatterns[ai];
                let length;
                if (ai === "01") length = 14; // GTIN length
                else if (ai === "10") length = 20; // Lot Number max length
                else length = 6; // Dates length
                const value = remainingCode.substring(2, 2 + length).replace(/[^0-9A-Za-z]/g, "");
                parsedResult[field] = value;
                remainingCode = remainingCode.substring(2 + length);
            } else {
                remainingCode = remainingCode.substring(2);
            }
        }
        return parsedResult;
    }

    function parseGS1Barcode(code) {
        const aiPatterns = {
            "01": "GTIN",
            "10": "Batch or Lot Number",
            "11": "Production Date",
            "17": "Expiration Date",
            // Add more AI patterns as needed
        };
        const parsedResult = {};
        let remainingCode = code;
        while (remainingCode.length > 0) {
            const ai = remainingCode.substring(0, 2);
            if (aiPatterns[ai]) {
                const field = aiPatterns[ai];
                let length;
                if (ai === "01") length = 14; // GTIN length
                else if (ai === "10") length = 20; // Lot Number max length
                else length = 6; // Dates length
                const value = remainingCode.substring(2, 2 + length).replace(/[^0-9A-Za-z]/g, "");
                parsedResult[field] = value;
                remainingCode = remainingCode.substring(2 + length);
            } else {
                remainingCode = remainingCode.substring(2);
            }
        }
        return parsedResult;
    }
}

// API Functions
function parseBarcode(code) {
    fetch(`https://accessgudid.nlm.nih.gov/api/v3/parse_udi.json?udi=${code}`)
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {
            console.log("Device data from AccessGUDID:", data);
            document.getElementById('id_lot_number').value = data.lotNumber || '';

            let convertedDate = '';
            if (data.expirationDateOriginal) {
                convertedDate = convertDate(data.expirationDateOriginal);
            }
            document.getElementById('id_expiration_date').value = convertedDate;

            fetchDeviceData(data.udi);

            // populateForm(data);
        })
        .catch(error => console.error('Error fetching device data:', error));
}

function fetchDeviceData(code) {
    fetch(`https://accessgudid.nlm.nih.gov/api/v3/devices/lookup.json?udi=${code}`)
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {
            console.log("Device data from AccessGUDID:", data);
            populateForm(data);
            fetchClassificationData(data.gudid.device.productCodes.fdaProductCode[0].productCode);
        })
        .catch(error => console.error('Error fetching device data:', error));
}

function fetchClassificationData(code) {
    fetch(`https://api.fda.gov/device/classification.json?search=product_code:${code}&limit=5`)
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {
            console.log("Device data from AccessGUDID Classification:", data);

            let classificationData = {
                medical_specialty_description: data.results[0].medical_specialty_description,
                device_class: data.results[0].device_class,
                device_name: data.results[0].device_name
            };
            console.log("Classification Date:", classificationData);

            // Send classification data to the server to create or update categories
            fetch('/api/classify-device/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': getCsrfToken()  // Function to get CSRF token
                },
                body: JSON.stringify(classificationData)
            })
                .then(response => response.json())
                .then(result => {
                    console.log('Device classified and category saved:', result);
                })
                .catch(error => console.error('Error classifying device:', error));

            // populateForm(data);
        })
        .catch(error => console.error('Error fetching device data:', error));
}

function getCsrfToken() {
    return document.querySelector('meta[name="csrf-token"]').getAttribute('content');
}

function populateForm(data) {
    if (data && data.gudid && data.gudid.device) {
        const device = data.gudid.device;
        document.getElementById('id_product_name').value = device.brandName || '';
        document.getElementById('id_description').value = device.deviceDescription || '';
        document.getElementById('id_manufacturer').value = toProperCase(device.companyName) || '';
        document.getElementById('id_reference_number').value = device.catalogNumber || '';


        let packageQuantity = '';
        let packageType = '';

        if (device.identifiers && device.identifiers.identifier) {
            for (const identifier of device.identifiers.identifier) {
                if (identifier.deviceIdType === "Package") {
                    packageQuantity = identifier.pkgQuantity || '';
                    packageType = toProperCase(identifier.pkgType || '');
                    break;
                } else {
                    packageQuantity = device.deviceCount || '';
                }
            }
        }


        document.getElementById('id_package_type').value = packageType;
        document.getElementById('id_package_quantity').value = packageQuantity;
        document.getElementById('id_deviceSterile').checked = device.sterilization.deviceSterile || false;
        document.getElementById('id_fullPackage').checked = device.deviceStatus || false;
    } else {
        console.log("No device data found");
    }
}

function handleFileSelect(event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            const data = new Uint8Array(e.target.result);
            const workbook = XLSX.read(data, {type: 'array'});
            const sheetName = workbook.SheetNames[0];
            const sheet = workbook.Sheets[sheetName];
            const json = XLSX.utils.sheet_to_json(sheet, {header: 1, raw: true});

            generatePreviewTable(json);
            generateMappingTable(json);
            document.getElementById('import-button').style.display = 'block';
            document.getElementById('fileInput').style.display = 'none';
            document.getElementById('import-modal-content').style.maxWidth = 'unset';
        };
        reader.readAsArrayBuffer(file);
    }
}

function generatePreviewTable(data) {
    const previewTableHead = document.getElementById('previewTableHead');
    const previewTableBody = document.getElementById('previewTableBody');
    previewTableHead.innerHTML = '';
    previewTableBody.innerHTML = '';

    const headerRow = document.createElement('tr');
    data[0].forEach(header => {
        const th = document.createElement('th');
        th.innerText = header;
        headerRow.appendChild(th);
    });
    previewTableHead.appendChild(headerRow);

    data.slice(1, 6).forEach(row => {
        const tr = document.createElement('tr');
        row.forEach(cell => {
            const td = document.createElement('td');
            td.innerText = typeof cell === 'number' && isExcelDate(cell) ? formatDate(cell) : cell;
            tr.appendChild(td);
        });
        previewTableBody.appendChild(tr);
    });

    document.getElementById('previewContainer').style.display = 'block';
}

function isExcelDate(value) {
    return value > 25569;
}

function toProperCase(str) {
    return str.toLowerCase().replace(/\b\w/g, char => char.toUpperCase());
}

function formatDate(excelDate) {
    const date = new Date((excelDate - (25567 + 1)) * 86400 * 1000);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${month}/${day}/${year}`;
}

function convertDate(dateString) {
    // Extract components from the input string
    const year = dateString.substring(0, 2);
    const month = dateString.substring(2, 4);
    const day = dateString.substring(4, 6);

    // Convert the year to YYYY format
    const fullYear = `20${year}`;

    // Format the date as MM/DD/YYYY
    const formattedDate = `${month}/${day}/${fullYear}`;

    return formattedDate;
}

function generateMappingTable(data) {
    const headers = data[0];
    const formFields = [
        {label: 'Product Name', value: 'title'},
        {label: 'Description', value: 'description'},
        {label: 'Category', value: 'category'},
        {label: 'Starting Bid', value: 'starting_bid'},
        {label: 'Reserve Bid', value: 'reserve_bid'},
        {label: 'Auction Duration', value: 'auction_duration'},
        {label: 'Manufacturer', value: 'manufacturer'},
        {label: 'Reference Number', value: 'reference_number'},
        {label: 'Lot Number', value: 'lot_number'},
        {label: 'Expiration Date', value: 'expiration_date'},
        {label: 'Package Type', value: 'package_type'},
        {label: 'Package Quantity', value: 'package_quantity'},
        {label: 'Device Sterile', value: 'deviceSterile'},
        {label: 'Full Package', value: 'fullPackage'}
    ];

    const mappingTable = document.getElementById('mappingTable');
    mappingTable.innerHTML = '';

    headers.forEach(header => {
        const row = document.createElement('tr');

        const fileHeaderCell = document.createElement('td');
        fileHeaderCell.innerText = header;
        row.appendChild(fileHeaderCell);

        const arrowCell = document.createElement('td');
        arrowCell.innerHTML = '<i class="fa-solid fa-arrow-right"></i>';
        row.appendChild(arrowCell);

        const formFieldCell = document.createElement('td');
        const select = document.createElement('select');
        select.classList.add('form-control');
        formFields.forEach(field => {
            const option = document.createElement('option');
            option.value = field.value;
            option.innerText = field.label;
            if (field.label.toLowerCase() === header.toLowerCase()) option.selected = true;
            select.appendChild(option);
        });
        formFieldCell.appendChild(select);
        row.appendChild(formFieldCell);

        mappingTable.appendChild(row);
    });

    document.getElementById('mappingContainer').style.display = 'block';
}

// Add event listeners to scan buttons for individual barcode fields
document.querySelectorAll('[id^="scanButton-"]').forEach(button => {
    button.addEventListener('click', () => {
        const inputId = button.getAttribute('data-input');
        startScanner(inputId);
        document.getElementById('scanModal').style.display = 'block';
    });
});
