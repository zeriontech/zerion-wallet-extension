import { expect } from '@playwright/test';
import { test } from './test';

test.describe.configure({ mode: 'parallel' });

test.describe('Signatures', () => {
  test('personal_sign approves a signature and a rejection reaches the dapp', async ({
    dapp,
    onboardingWallet,
  }) => {
    await dapp.approveConnection(onboardingWallet.address);

    const approvalPromise = dapp.waitForApprovalWindow();
    await dapp.clickPersonalSign();
    const approval = await approvalPromise;
    await approval.expectSignMessage('Example `personal_sign` message');
    await approval.approveSignature();
    await dapp.expectSignature(dapp.personalSignResult);

    const rejectionPromise = dapp.waitForApprovalWindow();
    await dapp.clickPersonalSign();
    const rejection = await rejectionPromise;
    await rejection.rejectSignature();
    await expect(dapp.personalSignButton).toContainText(
      'Error: Tx Signature: User denied transaction signature.',
    );
  });

  test('eth_signTypedData_v4 signs typed data and reports rejection', async ({
    dapp,
    onboardingWallet,
  }) => {
    await dapp.approveConnection(onboardingWallet.address);

    const approvalPromise = dapp.waitForApprovalWindow();
    await dapp.clickTypedDataV4();
    const approval = await approvalPromise;
    await approval.expectTypedData('Sign Message');
    await approval.approveSignature();
    await dapp.expectSignature(dapp.typedDataV4Result);

    const rejectionPromise = dapp.waitForApprovalWindow();
    await dapp.clickTypedDataV4();
    const rejection = await rejectionPromise;
    await rejection.rejectSignature();
    await expect(dapp.typedDataV4Result).toContainText(
      'Error: Tx Signature: User denied transaction signature.',
    );
  });

  test('SIWE and the PermitSingle fixture are signed as personal_sign and typed data', async ({
    dapp,
    onboardingWallet,
  }) => {
    await dapp.approveConnection(onboardingWallet.address);

    const siwePromise = dapp.waitForApprovalWindow();
    await dapp.clickSiwe();
    const siweApproval = await siwePromise;
    await siweApproval.expectSignMessage('wants you to sign in with your Ethereum account');
    await siweApproval.approveSignature();
    await dapp.expectSignature(dapp.siweResult);

    const permitPromise = dapp.waitForApprovalWindow();
    await dapp.clickPermitSingle();
    const permitApproval = await permitPromise;
    await permitApproval.expectTypedData('Permit');
    await permitApproval.approveSignature();
    await dapp.expectSignature(dapp.permitVariantResult);
  });
});
