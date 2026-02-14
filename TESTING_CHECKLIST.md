# Lead Magnet System - Testing Checklist

## ✅ Build Verification
- [x] Frontend builds successfully (no TypeScript errors)
- [x] All components compile correctly
- [x] No breaking changes introduced

---

## 📋 Manual Testing Checklist

### 1. Playbook Guide
- [ ] Visit: `http://localhost:5173/guides/deal-hunters-playbook.html`
- [ ] Verify all 50 tips display correctly
- [ ] Test "Save PDF" button (print dialog should open)
- [ ] Check mobile responsive design
- [ ] Verify all internal links work (thehubdeals.com)
- [ ] Test hover effects on tip cards

### 2. EmailCaptureHero Component (Homepage)
- [ ] Navigate to homepage
- [ ] Verify new headline: "Get the Deal Hunter's Playbook — Free"
- [ ] Verify new subhead mentions 50 tips
- [ ] Check 4 bullet points with green checkmarks display
- [ ] Verify "500+ subscribers" is GONE
- [ ] Test email submission
- [ ] Verify success state shows download button
- [ ] Click download button → should open playbook in new tab

### 3. EmailCaptureInline Component (In-Content)
- [ ] Find inline email capture in blog content
- [ ] Verify headline: "Get the Deal Hunter's Playbook — Free"
- [ ] Verify description mentions 50 tips
- [ ] Test email submission (compact form)
- [ ] Verify success state shows download button
- [ ] Click download button → should open playbook

### 4. EmailCaptureForm Component (Blog Posts)
- [ ] Visit a blog post with email capture form
- [ ] Verify title: "Get the Deal Hunter's Playbook — Free"
- [ ] Verify description mentions playbook + weekly insights
- [ ] Test email submission (full form with name field)
- [ ] Verify success state shows download button with CheckCircle icon
- [ ] Click download button → should open playbook

---

## 🎨 Visual QA

### Desktop (1920x1080)
- [ ] Hero component looks balanced
- [ ] Bullet points grid properly
- [ ] Playbook guide readable, proper spacing
- [ ] Download buttons prominent and clickable

### Tablet (768px)
- [ ] Forms stack vertically properly
- [ ] Playbook guide maintains readability
- [ ] Buttons remain accessible

### Mobile (375px)
- [ ] Hero component responsive
- [ ] Forms work on small screens
- [ ] Playbook guide scrolls smoothly
- [ ] Text remains readable (no overflow)

---

## 🔗 Integration Testing

### Email Flow
1. [ ] Subscribe via EmailCaptureHero
2. [ ] Check backend receives subscription (check logs)
3. [ ] Verify email sent (check email inbox)
4. [ ] Confirm email contains confirmation link
5. [ ] Verify source tracking (`homepage_hero`)

### Download Flow
1. [ ] Subscribe successfully
2. [ ] Click "Download Your Free Playbook"
3. [ ] Playbook opens in new tab
4. [ ] Print/PDF export works
5. [ ] Can return to site easily (nav links work)

### Backend Verification
- [ ] Check subscriber count increased
- [ ] Verify source attribution works
- [ ] Check email service logs (no errors)
- [ ] Confirm subscriber data stored correctly

---

## 🚀 Pre-Launch Checklist

### Content Review
- [ ] Proofread all 50 tips (spelling, grammar)
- [ ] Verify all links point to correct destinations
- [ ] Check brand consistency (The Hub Deals)
- [ ] Verify no placeholder text remains

### Technical
- [ ] Playbook file accessible at `/guides/deal-hunters-playbook.html`
- [ ] No console errors on any page
- [ ] All images/icons load properly
- [ ] Forms submit without errors

### Analytics
- [ ] Set up conversion tracking for downloads
- [ ] Track email capture sources
- [ ] Monitor playbook page views
- [ ] Set up goal in Google Analytics (if applicable)

### Legal/Compliance
- [ ] Privacy policy mentions email collection
- [ ] Unsubscribe link in emails
- [ ] GDPR compliance (if applicable)
- [ ] CAN-SPAM compliance

---

## 📊 Success Metrics (Track After Launch)

### Week 1
- [ ] Conversion rate baseline established
- [ ] Download rate measured
- [ ] User feedback collected
- [ ] Technical issues logged

### Week 2-4
- [ ] A/B test different headlines
- [ ] Optimize button placement
- [ ] Test social proof elements
- [ ] Refine copy based on feedback

### Month 1
- [ ] Compare conversion rates (before vs after)
- [ ] Measure subscriber retention
- [ ] Analyze traffic sources
- [ ] Plan next improvements

---

## 🐛 Known Issues / To Fix

*None currently - system is ready for testing*

---

## 📝 Testing Notes

**Tester:** _________________
**Date:** _________________
**Environment:** _________________

**Issues Found:**
1. ___________________________________
2. ___________________________________
3. ___________________________________

**Recommendations:**
1. ___________________________________
2. ___________________________________
3. ___________________________________

---

**Status:** ⏳ Ready for Manual Testing
**Next Step:** Start frontend dev server and run through checklist

```bash
cd /Users/sydneyjackson/the-hub/the-hub
npm run dev
# Visit http://localhost:5173
```
