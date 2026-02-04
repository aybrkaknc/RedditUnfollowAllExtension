---
description: Değişiklik yapıldıktan sonra sürüm güncelleme kararı ve release süreci
---

# 🚀 Release Workflow

Bu workflow, agent tarafından kod değişikliği yapıldıktan sonra uygulanır.

---

## 📋 Workflow Akışı

### ADIM 1: Değişikliği Yap
Agent, kullanıcının talep ettiği değişikliği gerçekleştirir.

### ADIM 2: Sürüm Güncelleme Kararı
Değişiklik tamamlandıktan sonra agent şu soruyu sorar:

```
✅ Değişiklik tamamlandı.

📦 Sürüm güncellemesine gerek var mı?

[VAR] - Release workflow başlatılacak (commit + sürüm + build + zip)
[YOK] - Sadece değişiklik kaydedilecek, sürüm aynı kalacak
```

---

## 🔴 "YOK" Seçilirse

Sürüm güncellenmez. Değişiklikler mevcut haliyle bırakılır.
- Build alınmaz
- Zip oluşturulmaz
- Commit atılmaz (kullanıcı isterse manuel atar)

---

## 🟢 "VAR" Seçilirse → Release Workflow

### A. Değişiklik Tipini Belirle
Agent, yapılan değişikliğe göre tip önerir:

| Tip | Açıklama | Örnek |
|-----|----------|-------|
| `patch` | Hata düzeltmesi, küçük iyileştirme | 0.2.0 → 0.2.1 |
| `minor` | Yeni özellik ekleme | 0.2.0 → 0.3.0 |
| `major` | Breaking change, özellik kaldırma | 0.2.0 → 1.0.0 |

### B. Onay İste
```
📦 RELEASE ONAYI

Değişiklik Tipi: [patch/minor/major]
Mevcut Sürüm: [x.y.z]
Yeni Sürüm: [yeni_sürüm]

Commit Mesajı: [tip]: [açıklama]

Yapılacak İşlemler:
1. ✓ Değişiklikler commit edilecek
2. ✓ Sürüm güncellenecek
3. ✓ Build alınacak
4. ✓ Release zip oluşturulacak

Onaylıyor musunuz?
```

### C. Release Adımlarını Çalıştır

1. **Commit değişiklikleri**
```bash
git add -A
git commit -m "<tip>: <açıklama>"
```

2. **Sürümü güncelle**
```bash
npm version <patch|minor|major> --no-git-tag-version
```

3. **Sürüm commit'i**
```bash
git add package.json package-lock.json
git commit -m "chore: release v<yeni_sürüm>"
```

4. **Build ve paketleme**
```bash
npm run release
```

### D. Push (İsteğe Bağlı/Otomatik)
```bash
git push
```

### E. Sonuç Raporu
```
✅ RELEASE TAMAMLANDI

Sürüm: v<yeni_sürüm>
Dosya: releases/swiftshift-v<yeni_sürüm>.zip
Boyut: <boyut> KB
```

---

## ⚠️ Kurallar

1. Kullanıcı "VAR" demeden release başlatılmaz
2. Kullanıcı onayı olmadan hiçbir komut çalıştırılmaz
3. Hata durumunda işlem durdurulur ve bilgi verilir

