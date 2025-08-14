
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { GoogleGenAI, Chat } from "@google/genai";
import { Html5Qrcode } from "html5-qrcode";

// --- Mock User Profile Data ---
const userProfile = {
    name: 'عمر أحمد',
    accountId: 'SHAM-USER-12345',
    iban: 'SY24 0987 0000 1234 5678 9012 34',
    fiatCard: {
        number: '**** **** **** 4829',
        expiry: '12/28',
    },
    cryptoCard: {
        number: '**** **** **** 9317',
        expiry: '08/29',
    },
    quickContacts: [
        { name: 'أحمد', initial: 'أ', color: 'bg-blue-500' },
        { name: 'سارة', initial: 'س', color: 'bg-pink-500' },
        { name: 'محمد', initial: 'م', color: 'bg-green-500' },
        { name: 'فاطمة', initial: 'ف', color: 'bg-purple-500' },
        { name: 'يوسف', initial: 'ي', color: 'bg-orange-500' },
    ]
};


// --- AI Chatbot Elements ---
const chatFab = document.getElementById('chat-fab') as HTMLButtonElement;
const chatModal = document.getElementById('chat-modal') as HTMLDivElement;
const closeChatBtn = document.getElementById('chat-close-btn') as HTMLButtonElement;
const chatForm = document.getElementById('chat-form') as HTMLFormElement;
const chatInput = document.getElementById('chat-input') as HTMLInputElement;
const chatMessages = document.getElementById('chat-messages') as HTMLDivElement;
const chatSendBtn = document.getElementById('chat-send-btn') as HTMLButtonElement;

let ai: GoogleGenAI | null = null;
let chat: Chat | null = null;

// --- AI Chatbot Logic ---
const systemInstruction = `You are a friendly and helpful banking assistant for بنك شام (SHAM Bank).
Your name is 'مساعد شام الذكي'.
You can answer questions about the bank's services, like opening accounts, transaction types, and general information about crypto.
You should not ask for personal information like passwords or account numbers.
When asked about account balance or specific transactions, you should explain that you don't have access to real-time personal data for security reasons but you can guide the user on how to find it in the app.
All your responses must be in Arabic.`;

function initializeChat() {
  try {
    if (!process.env.API_KEY) {
      throw new Error("API_KEY is not set.");
    }
    ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    chat = ai.chats.create({
      model: 'gemini-2.5-flash',
      config: {
        systemInstruction: systemInstruction,
      },
    });
    chatFab.disabled = false;
    appendMessage(
        'مرحباً! أنا مساعد شام الذكي. كيف يمكنني مساعدتك اليوم؟',
        'ai'
      );
  } catch (error) {
    console.error("Failed to initialize AI Chat:", error);
    chatFab.disabled = true;
    chatFab.style.backgroundColor = '#9ca3af'; // gray-400
    chatFab.style.cursor = 'not-allowed';
  }
}

function appendMessage(text: string, sender: 'user' | 'ai', isStreaming = false) {
  const messageWrapper = document.createElement('div');
  messageWrapper.classList.add('chat-message', `${sender}-message`);

  const messageBubble = document.createElement('div');
  messageBubble.classList.add('message-bubble');
  
  const content = document.createElement('p');
  content.textContent = text;
  
  messageBubble.appendChild(content);

  if (isStreaming) {
    const typingIndicator = document.createElement('div');
    typingIndicator.classList.add('typing-indicator');
    typingIndicator.innerHTML = '<span></span><span></span><span></span>';
    messageBubble.appendChild(typingIndicator);
    messageWrapper.id = 'streaming-message';
  }
  
  messageWrapper.appendChild(messageBubble);
  chatMessages.appendChild(messageWrapper);
  chatMessages.scrollTop = chatMessages.scrollHeight;

  return messageWrapper;
}


async function handleSendMessage(event: SubmitEvent) {
  event.preventDefault();
  const userMessage = chatInput.value.trim();
  if (!userMessage || !chat) return;

  chatInput.value = '';
  chatInput.disabled = true;
  chatSendBtn.disabled = true;
  
  appendMessage(userMessage, 'user');

  const aiMessageWrapper = appendMessage('', 'ai', true);
  const aiMessageBubble = aiMessageWrapper.querySelector('.message-bubble p') as HTMLParagraphElement;
  
  try {
    const stream = await chat.sendMessageStream({ message: userMessage });
    
    let fullResponse = '';
    for await (const chunk of stream) {
      fullResponse += chunk.text;
      aiMessageBubble.textContent = fullResponse;
      chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    const typingIndicator = aiMessageWrapper.querySelector('.typing-indicator');
    if(typingIndicator) {
      typingIndicator.remove();
    }
  
  } catch (error) {
    console.error("Error sending message:", error);
    aiMessageBubble.textContent = "عذراً، حدث خطأ ما. يرجى المحاولة مرة أخرى.";
    const typingIndicator = aiMessageWrapper.querySelector('.typing-indicator');
    if(typingIndicator) {
      typingIndicator.remove();
    }
  } finally {
    chatInput.disabled = false;
    chatSendBtn.disabled = false;
    chatInput.focus();
  }
}

// --- App Data Population ---
function populateUserProfileData() {
    // Welcome message
    const welcomeEl = document.getElementById('welcome-message');
    if (welcomeEl) {
        welcomeEl.textContent = `مرحباً بك، ${userProfile.name.split(' ')[0]}`;
    }

    // Fiat Card
    document.getElementById('fiat-card-name')!.textContent = userProfile.name.toUpperCase();
    document.getElementById('fiat-card-number')!.textContent = userProfile.fiatCard.number;
    document.getElementById('fiat-card-expiry')!.textContent = userProfile.fiatCard.expiry;
    document.getElementById('iban-number')!.textContent = userProfile.iban;
    
    // Crypto Card
    document.getElementById('crypto-card-name')!.textContent = userProfile.name.toUpperCase();
    document.getElementById('crypto-card-number')!.textContent = userProfile.cryptoCard.number;
    document.getElementById('crypto-card-expiry')!.textContent = userProfile.cryptoCard.expiry;
    
    // My Code Modal
    document.getElementById('my-code-name')!.textContent = userProfile.name;
    document.getElementById('my-code-account-id')!.textContent = userProfile.accountId;

    // Quick Contacts
    const contactsContainer = document.getElementById('quick-contacts-container');
    if(contactsContainer) {
        contactsContainer.innerHTML = userProfile.quickContacts.map(contact => `
            <div class="flex-shrink-0 text-center cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 p-3 rounded-xl transition-colors">
                <div class="w-12 h-12 ${contact.color} rounded-full flex items-center justify-center mb-2 mx-auto">
                    <span class="text-white font-bold">${contact.initial}</span>
                </div>
                <p class="text-sm font-medium text-gray-900 dark:text-white">${contact.name}</p>
            </div>
        `).join('');
    }
}


// --- App Initialization ---
document.addEventListener('DOMContentLoaded', () => {
  // Initialize AI Chat
  initializeChat();
  
  // Populate User Data
  populateUserProfileData();

  // --- Element Selections ---
  const screens = {
    home: document.getElementById('home-screen'),
    crypto: document.getElementById('crypto-screen'),
    cards: document.getElementById('cards-screen'),
    security: document.getElementById('security-screen'),
  };
  const navItems = {
    home: document.getElementById('nav-home'),
    crypto: document.getElementById('nav-crypto'),
    cards: document.getElementById('nav-cards'),
    security: document.getElementById('nav-security'),
  };
  
  // Modals
  const shamCashModal = document.getElementById('shamCashModal');
  const cryptoModal = document.getElementById('cryptoModal');
  const cryptoWithdrawModal = document.getElementById('cryptoWithdrawModal');
  const xrpSendModal = document.getElementById('xrpSendModal');
  const myCodeModal = document.getElementById('myCodeModal');
  const scanPayModal = document.getElementById('scanPayModal');

  // --- Screen Navigation Logic ---
  function navigateTo(screenName: keyof typeof screens) {
    Object.values(screens).forEach(screen => screen?.classList.add('hidden'));
    Object.values(navItems).forEach(nav => nav?.classList.remove('active'));
    screens[screenName]?.classList.remove('hidden');
    navItems[screenName]?.classList.add('active');
  }

  navItems.home?.addEventListener('click', () => navigateTo('home'));
  navItems.crypto?.addEventListener('click', () => navigateTo('crypto'));
  navItems.cards?.addEventListener('click', () => navigateTo('cards'));
  navItems.security?.addEventListener('click', () => navigateTo('security'));

  // --- AI Chat Listeners ---
  chatFab.addEventListener('click', () => {
    chatModal.classList.add('visible');
    chatFab.classList.add('hidden');
  });
  closeChatBtn.addEventListener('click', () => {
    chatModal.classList.remove('visible');
    chatFab.classList.remove('hidden');
  });
  chatForm.addEventListener('submit', handleSendMessage);

  // --- Generic Modal Logic ---
  function openModal(modal: HTMLElement | null) {
      if (!modal) return;
      modal.classList.remove('hidden');
      modal.classList.add('flex');
  }
  function closeModal(modal: HTMLElement | null) {
      if (!modal) return;
      modal.classList.add('hidden');
      modal.classList.remove('flex');
  }
  
  // --- All Modal Event Listeners ---
  document.getElementById('sham-cash-btn')?.addEventListener('click', () => openModal(shamCashModal));
  document.getElementById('close-sham-cash-btn')?.addEventListener('click', () => closeModal(shamCashModal));
  document.getElementById('process-sham-cash-btn')?.addEventListener('click', () => {
    alert('جاري معالجة إيداع شام كاش...');
    closeModal(shamCashModal);
  });
  
  document.getElementById('crypto-deposit-btn')?.addEventListener('click', () => openModal(cryptoModal));
  document.getElementById('close-crypto-btn')?.addEventListener('click', () => closeModal(cryptoModal));
  
  document.getElementById('crypto-withdraw-btn')?.addEventListener('click', () => openModal(cryptoWithdrawModal));
  document.getElementById('close-crypto-withdraw-btn')?.addEventListener('click', () => closeModal(cryptoWithdrawModal));
  document.getElementById('process-crypto-withdraw-btn')?.addEventListener('click', () => {
    alert('جاري معالجة طلب السحب...');
    closeModal(cryptoWithdrawModal);
  });

  document.getElementById('xrp-send-btn')?.addEventListener('click', () => openModal(xrpSendModal));
  document.getElementById('close-xrp-send-btn')?.addEventListener('click', () => closeModal(xrpSendModal));
  document.getElementById('process-xrp-send-btn')?.addEventListener('click', () => {
    alert('جاري إرسال XRP...');
    closeModal(xrpSendModal);
  });
  
  // --- Card Screen Button Logic ---
  document.getElementById('copy-iban-btn')?.addEventListener('click', () => {
    const iban = document.getElementById('iban-number')?.textContent;
    if (iban) {
        navigator.clipboard.writeText(iban).then(() => {
            alert('تم نسخ رقم الحساب الدولي (IBAN)!');
        });
    }
  });
  document.getElementById('add-to-wallet-btn')?.addEventListener('click', () => {
    alert('جاري إضافة البطاقة إلى محفظة جوجل...');
  });

  // Crypto Deposit Address Logic
  const cryptoSelect = document.getElementById('cryptoSelect') as HTMLSelectElement;
  const cryptoAddressContainer = document.getElementById('cryptoAddressContainer');
  const cryptoAddressEl = document.getElementById('cryptoAddress');
  const copyCryptoAddressBtn = document.getElementById('copy-crypto-address-btn');

  cryptoSelect?.addEventListener('change', (e) => {
    const target = e.target as HTMLSelectElement;
    if (target.value && cryptoAddressEl) {
        cryptoAddressEl.textContent = `0x...${target.value}...${Math.random().toString(36).substring(2, 10)}`;
        cryptoAddressContainer?.classList.remove('hidden');
    } else {
        cryptoAddressContainer?.classList.add('hidden');
    }
  });

  copyCryptoAddressBtn?.addEventListener('click', () => {
      if (cryptoAddressEl?.textContent) {
          navigator.clipboard.writeText(cryptoAddressEl.textContent).then(() => {
              alert('تم نسخ العنوان!');
          });
      }
  });

  // --- QR Code Logic ---
  const myQrCodeImg = document.getElementById('my-qr-code-img') as HTMLImageElement;
  const qrReaderElement = document.getElementById("qr-reader");

  // My Code Modal
  document.getElementById('my-code-btn')?.addEventListener('click', () => {
    const userData = { userAccount: userProfile.accountId, name: userProfile.name };
    const encodedData = encodeURIComponent(JSON.stringify(userData));
    if (myQrCodeImg) {
      myQrCodeImg.src = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodedData}`;
    }
    openModal(myCodeModal);
  });
  document.getElementById('close-my-code-btn')?.addEventListener('click', () => closeModal(myCodeModal));

  // Scan to Pay Modal
  if (qrReaderElement) {
    const html5QrCode = new Html5Qrcode("qr-reader");

    const onScanSuccess = (decodedText: string, decodedResult: any) => {
        console.log(`Code matched = ${decodedText}`, decodedResult);
        try {
            const scannedData = JSON.parse(decodedText);
            alert(`تم مسح رمز الدفع لـ:\nالاسم: ${scannedData.name}\nالحساب: ${scannedData.userAccount}`);
        } catch(e) {
            alert(`تم مسح الرمز بنجاح:\n${decodedText}`);
        }
        closeScanPayModal();
    };

    const onScanFailure = (error: any) => {
        // console.warn(`Code scan error = ${error}`);
    };
    
    const closeScanPayModal = () => {
        html5QrCode.stop().then(ignore => {
          // QR Code scanning is stopped.
        }).catch(err => {
          // Stop failed, handle it.
        });
        closeModal(scanPayModal);
    };

    document.getElementById('scan-pay-btn')?.addEventListener('click', () => {
        openModal(scanPayModal);
        html5QrCode.start({ facingMode: "environment" }, { fps: 10, qrbox: {width: 250, height: 250} }, onScanSuccess, onScanFailure)
            .catch(err => console.log("Unable to start scanning.", err));
    });
    
    document.getElementById('close-scan-pay-btn')?.addEventListener('click', closeScanPayModal);
  }
});