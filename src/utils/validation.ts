// Digital Transaction Validation
export interface DigitalTransactionValidationData {
  phoneNumber: string;
  transactionDate: string;
  provider: string;
  providers: string[];
  amount: string;
  sellingPrice: string;
  costPrice: string;
}

export interface ValidationErrors {
  phoneNumber?: string;
  transactionDate?: string;
  provider?: string;
  amount?: string;
  sellingPrice?: string;
  costPrice?: string;
}

export const validateDigitalTransaction = (
  data: DigitalTransactionValidationData
): ValidationErrors => {
  const errors: ValidationErrors = {};

  // Validate phone number
  if (!data.phoneNumber.trim()) {
    errors.phoneNumber = "Nomor pelanggan wajib diisi.";
  }

  // Validate transaction date
  if (!data.transactionDate) {
    errors.transactionDate = "Tanggal transaksi wajib diisi.";
  }

  // Validate provider
  if (data.providers.length > 0 && !data.provider && data.provider !== "Lainnya") {
    errors.provider = "Provider wajib dipilih.";
  } else if (data.provider === "Lainnya" && !data.provider.trim()) {
    errors.provider = "Nama provider manual wajib diisi.";
  }

  // Validate amount
  if (!data.amount) {
    errors.amount = "Nominal wajib diisi.";
  } else {
    const amountValue = parseFloat(data.amount);
    if (isNaN(amountValue) || amountValue <= 0) {
      errors.amount = "Nominal harus berupa angka positif.";
    }
  }

  // Validate selling price
  if (!data.sellingPrice) {
    errors.sellingPrice = "Harga Jual wajib diisi.";
  } else {
    const sellValue = parseFloat(data.sellingPrice);
    if (isNaN(sellValue) || sellValue <= 0) {
      errors.sellingPrice = "Harga Jual harus berupa angka positif.";
    }
  }

  // Validate cost price
  const costValue = parseFloat(data.costPrice) || 0;
  if (costValue < 0) {
    errors.costPrice = "Harga Modal tidak boleh negatif.";
  }

  return errors;
};

// Digital Product Validation
export interface DigitalProductValidationData {
  provider: string;
  name: string;
  nominal: string;
  sellingPrice: string;
}

export const validateDigitalProduct = (
  data: DigitalProductValidationData
): ValidationErrors => {
  const errors: ValidationErrors = {};

  if (!data.provider.trim()) {
    errors.provider = "Provider wajib diisi.";
  }

  if (!data.name.trim()) {
    errors.sellingPrice = "Nama produk wajib diisi.";
  }

  if (!data.nominal || parseFloat(data.nominal) <= 0) {
    errors.amount = "Nominal harus berupa angka positif.";
  }

  if (!data.sellingPrice || parseFloat(data.sellingPrice) <= 0) {
    errors.sellingPrice = "Harga jual harus berupa angka positif.";
  }

  return errors;
};
