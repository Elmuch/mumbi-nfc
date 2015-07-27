var compatibleDevices = [
  {
    deviceName: 'ACR122U USB NFC Reader',
    productId: 0x2200,
    vendorId: 0x072f,
    thumbnailURL: chrome.runtime.getURL('images/acr122u.png')
  },
  {
    deviceName: 'SCL3711 Contactless USB Smart Card Reader',
    productId: 0x5591,
    vendorId: 0x04e6,
    thumbnailURL: chrome.runtime.getURL('images/scl3711.png')
  }
]

var device = null;

function log(message, errorType, object) {
  $logArea = $('.logs');
  $pre = $('<pre/>',{
    "text": message,
    'class' : errorType
  })

  function flash(){
    $pre.fadeOut(100)
  }

 $logArea.append($pre);
 // setTimeout(flash,1000)
  // logArea.scrollTop = logArea.scrollHeight;
  // document.querySelector('#logContainer').classList.remove('small');
}

function handleDeviceTimeout(func, args) {
  var timeoutInMs = 1500;
  var hasTags = false;
  setTimeout(function() {
    if (!hasTags) {
      log('Timeout! No tag detected', 'text-danger');
    }
  }, timeoutInMs);
  var args = args || [];
  args = args.concat([function() { hasTags = true; }]);
  func.apply(this, args);
}

function onReadNdefTagButtonClicked() {
  handleDeviceTimeout(readNdefTag);
}

function readNdefTag(callback) {
  chrome.nfc.read(device, {}, function(type, ndef) {
    var ul = $('<ul/>',{'class': 'list-unstyled'});
    log('Found ' + ndef.ndef.length + ' NFC Tag(s)','text-info' );
    ul.append($('<li/>',{
      text: "ID: " + device.cid
    }));
    for (var i = 0; i < ndef.ndef.length; i++)
      ul.append($('<li>',{
        'text': ndef.ndef[i].text
      }));
    $('#user-data').html(ul);
    callback();
  });
}

function onReadMifareTagButtonClicked() {
  handleDeviceTimeout(readMifareTag);
}

function readMifareTag(callback) {
  var blockNumber = 0; // starting logic block number.
  var blocksCount = 2; // logic block counts.
  chrome.nfc.read_logic(device, blockNumber, blocksCount, function(rc, data) {
    log('Mifare Classic Tag', UTIL_BytesToHex(data));
    callback();
  });
}

function onWriteNdefTagButtonClicked() {
  $('#c-id').val(device.cid);
  var date = new Date()
  $('#date').val(date.toLocaleString());
  handleDeviceTimeout(writeNdefTag, []);
}

function writeNdefTag(ndefType, ndefValue, callback) {
  $('form').submit(function(event){
    var ndef = [
      {"text": $('#payment').val()},
      {"text": $('#date').val()}
    ];

    chrome.nfc.write(device, {"ndef": ndef}, function(rc) {
      if (!rc) {
        log('Tag written successfully', 'text-success');
      } else {
        log('Tag write operation failed', 'text-danger',rc);
      }
    });
    callback();
    return false;
  });
};

function onWriteMifareTagButtonClicked() {
  try {
    var mifareData = JSON.parse(document.querySelector('#mifare-data').value);
    handleDeviceTimeout(writeMifareTag, [mifareData]);
  }
  catch(e) {
    log('Error', 'Mifare Data is not an Array.');
  }
}

function writeMifareTag(mifareData, callback) {
  var data = new Uint8Array(mifareData);
  var blockNumber = 0; // starting logic block number.
  chrome.nfc.write_logic(device, 0, data, function(rc) {
    if (!rc) {
      log('Mifare Tag written!');
    } else {
      log('Mifare Tag write operation failed', rc);
    }
    callback();
  });
}

function onEmulateTagButtonClicked() {
  var ndefType = document.querySelector('#emulate-ndef-type').value;
  var ndefValue = document.querySelector('#emulate-ndef-value').value;
  handleDeviceTimeout(emulateTag, [ndefType, ndefValue]);
}

function emulateTag(ndefType, ndefValue, callback) {
  var ndef = {};
  ndef[ndefType] = ndefValue;
  chrome.nfc.emulate_tag(device, {"ndef": [ndef]}, function(rc) {
    if (!rc) {
      log('NFC Tag emulated!');
    } else {
      log('NFC Tag emulate operation failed', rc);
    }
    callback();
  });
}

function showDeviceInfo() {
  var deviceInfo = null;
  for (var i = 0; i < compatibleDevices.length; i++)
    if (device.productId === compatibleDevices[i].productId && 
        device.vendorId === compatibleDevices[i].vendorId)
      deviceInfo = compatibleDevices[i];
    
  if (!deviceInfo)
    return;
  
  var thumbnail = document.querySelector('#device-thumbnail');
  thumbnail.src = deviceInfo.thumbnailURL;
  thumbnail.classList.remove('hidden');
  
  var deviceName = document.querySelector('#device-name');
  deviceName.textContent = deviceInfo.deviceName;
  
  var productId = document.querySelector('#device-product-id');
  productId.textContent = deviceInfo.productId;
  
  var vendorId = document.querySelector('#device-vendor-id');
  vendorId.textContent = deviceInfo.vendorId;
  
  $('a[href="#device-info"]').tab('show');
}

function enumerateDevices() {
  chrome.nfc.findDevices(function(devices) {
    device = devices[0];
    showDeviceInfo(); 
  });
}

enumerateDevices();

$('#read-ndef').click(onReadNdefTagButtonClicked);
$('#write-ndef').click(onWriteNdefTagButtonClicked);

$('#write-tab').click(function(event){
  $('#read-template').hide()
  $('#write-template').fadeIn(1000);
})

$('#read-ndef').click(function(event){
  $('#write-template').hide();
  $('#read-template').fadeIn(1000);
})

$('.clear-logs').click(function(event){
  $('pre').fadeOut(600)
})
// document.querySelector('#read-mifare pre').textContent = readMifareTag.toString();

// document.querySelector('#write-ndef pre').textContent = writeNdefTag.toString();
// document.querySelector('#write-ndef button').addEventListener('click', onWriteNdefTagButtonClicked);

// document.querySelector('#write-mifare pre').textContent = writeMifareTag.toString();
// document.querySelector('#write-mifare button').addEventListener('click', onWriteMifareTagButtonClicked);

// document.querySelector('#emulate pre').textContent = emulateTag.toString();
// document.querySelector('#emulate button').addEventListener('click', onEmulateTagButtonClicked);

// $('a[data-toggle="tab"]').on('shown.bs.tab', function (e) {
//   document.querySelector('#logContainer').classList.add('small');
// });

// document.querySelector('.drawer').addEventListener('click', function(e) {
//   document.querySelector('#logContainer').classList.toggle('small');
// });
