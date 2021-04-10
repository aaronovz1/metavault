const chai = require('chai');
const { expect } = chai;
const { solidity } = require('ethereum-waffle');
chai.use(solidity);
const hardhat = require('hardhat');
const { deployments, ethers } = hardhat;
const { parseEther } = ethers.utils;
const ether = parseEther;
const { setupTestMetavault } = require('../helpers/setup');

describe('StrategyYearnV2', () => {
    let strategy,
        deployer,
        user,
        dai,
        usdt,
        t3crv,
        weth,
        vault,
        vaultManager,
        converter,
        controller,
        router;

    before(async () => {
        const config = await setupTestMetavault();
        deployer = config.deployer;
        user = config.user;
        dai = config.dai;
        usdt = config.usdt;
        t3crv = config.t3crv;
        weth = config.weth;
        vault = config.vault;
        vaultManager = config.vaultManager;
        converter = config.converter;
        controller = config.controller;
        router = config.router;

        const Strategy = await deployments.get('StrategyYearnV2-DAI');
        strategy = await ethers.getContractAt('StrategyYearnV2', Strategy.address, deployer);

        await controller.addStrategy(
            t3crv.address,
            Strategy.address,
            0,
            converter.address,
            false,
            0,
            { from: deployer }
        );
    });

    beforeEach(async () => {
        expect(await t3crv.balanceOf(controller.address)).to.equal(0);
        expect(await t3crv.balanceOf(strategy.address)).to.equal(0);
    });

    afterEach(async () => {
        expect(await t3crv.balanceOf(controller.address)).to.equal(0);
        expect(await t3crv.balanceOf(strategy.address)).to.equal(0);
    });

    it('should deploy with initial state set', async () => {
        expect(await strategy.name()).to.equal('YearnV2: DAI');
        expect(await strategy.want()).to.equal(dai.address);
        expect(await strategy.weth()).to.equal(weth.address);
        expect(await strategy.controller()).to.equal(controller.address);
        expect(await strategy.vaultManager()).to.equal(vaultManager.address);
        expect(await strategy.router()).to.equal(router.address);
    });

    it('should deposit DAI', async () => {
        await vault.deposit(ether('10'), dai.address, 1, true, { from: user });
        expect(await dai.balanceOf(user)).to.equal(ether('990'));
        expect(await controller.balanceOf(t3crv.address)).to.be.above(ether('9'));
        expect(await vault.getPricePerFullShare()).to.be.least(ether('0.9998'));
    });

    it('should withdraw to DAI', async () => {
        expect((await vault.userInfo(user)).amount).to.be.least(ether('9.99'));
        await vault.withdraw(ether('5'), dai.address, { from: user });
        expect((await vault.userInfo(user)).amount).to.be.least(ether('4.99'));
        expect(await dai.balanceOf(user)).to.be.least(ether('994'));
    });

    it('should withdrawAll to 3CRV', async () => {
        await vault.withdrawAll(t3crv.address, { from: user });
        expect(await vault.balanceOf(user)).to.equal(0);
        expect(await vault.totalSupply()).to.equal(0);
        expect(await t3crv.balanceOf(user)).to.be.least(ether('4.99'));
    });

    it('should deposit USDT', async () => {
        await vault.deposit('10000000', usdt.address, 1, true, { from: user });
        expect(await strategy.balanceOfPool()).to.be.above(ether('9'));
        expect(await controller.balanceOf(t3crv.address)).to.be.above(ether('9'));
        expect(await vault.getPricePerFullShare()).to.be.above(ether('1'));
    });

    it('should withdrawAll by controller', async () => {
        expect(await t3crv.balanceOf(vault.address)).to.be.below(ether('1'));
        await controller.withdrawAll(strategy.address);
        expect(await t3crv.balanceOf(vault.address)).to.be.least(ether('9.99'));
    });
});
