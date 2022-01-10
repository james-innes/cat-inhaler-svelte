<script>
	import { onMount } from "svelte";
	import { payments } from "@square/web-sdk";

	let card, applePay, googlePay, sucess, process, email, geoRef, address;
	const PRICE = 1000;

	onMount(async () => {
		const autocomplete = new google.maps.places.Autocomplete(geoRef, {
			types: ["address"],
			fields: ["formatted_address", "geometry"],
		});

		autocomplete.addListener(
			"place_changed",
			() => (address = autocomplete.getPlace())
		);

		let square = await payments("SQUARE_APP", "SQUARE_LOCATION");
		let request = square.paymentRequest({
			countryCode: "GB",
			currencyCode: "GBP",
			requestBillingContact: true,
			total: PRICE,
			total: { amount: PRICE.toString(), label: "Total", pending: false },
		});

		window.ApplePaySession && (applePay = await square.applePay(request));
		card = await square.card({
			style: {
				".input-container": {
					borderColor: "#e5f0f0",
					borderRadius: "9.6px",
					borderWidth: "2px",
				},
				".input-container.is-focus": {
					borderColor: "#ff89af",
				},
				".input-container.is-error": {
					borderColor: "orange",
				},
				input: {
					color: "#ff89af",
					fontFamily: "Helvetica, sans-serif",
					fontWeight: 500,
					fontSize: "16px",
				},
				"input::placeholder": {
					color: "black",
				},
				"input.is-error": {
					color: "orange",
				},
				"input.is-focus": {
					color: "#ff89af",
				},
				".message-text": {
					color: "black",
				},
				".message-icon": {
					color: "#ff89af",
				},
				".message-text.is-error": {
					color: "orange",
				},
				".message-icon.is-error": {
					color: "orange",
				},
			},
		});
		await card.attach("#card");
		googlePay = await square.googlePay(request);
		await googlePay.attach("#google-pay");
	});

	async function pay(e, method) {
		e.preventDefault();
		process = true;
		let payment = await method.tokenize();

		console.log(payment);

		let r = await fetch("/.netlify/functions/checkout", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify({
				token: payment.token,
				email: (email
					? phemailone
					: payment.details?.card?.billing?.email ||
					  payment.details?.shipping?.contact?.email
				)
					.replace(/\s+/g, "")
					.slice(-10),
				product: "Cat Inhaler",
				total: PRICE,
			}),
		});

		if (r.status == 201) {
			sucess = true;
		} else {
			process = false;
			alert("Failed to process order.");
		}
	}
</script>

<div class="card">
	<img src="logo.png" alt="Cat Inhaler Logo" id="logo" />

	<p>
		Like humans, cats can also suffer from asthma and the same method of
		treatment using an inhaler is applicable. However, unlike health care
		options for humans the inhalers and the accompanying adapters and masks for
		your pet may be limited in choice and not offer good value for money. A
		popular branded product as an example is the AeroKat which costs from £65
		with similar products being retailed for as much as £100 on other websites.
		Frankly, this is ridiculous to pay so much for a bit of plastic but the pet
		companies know there is not much choice so they can charge what they like.
		These spacer products often also force you to buy their own asthma cartridge
		from them by making the connector round. However, with some help from your
		vet, you can buy the exact same medical product your cat needs from your
		local pharmacy. In the UK the shape of all inhalers are standardised so our
		spacer is designed to fit this standard as pictured in the small diagram.
		The current prescription cost in the UK from the NHS is about £9 to pick up
		the inhaler. However to administer the inhaler for your cat you need the
		spacer and mask. A small vent is built into the spacer to allow for the cat
		to exhale. The mask comes in a small size to fit cats. If you need this for
		a dog you might be better off with a large mask which we do not currently
		sell. Some people have also found it cheaper to buy asthma inhaler spacers
		for babies but you will find that the mask is a little too big and covers
		the eyes of your cat which can be a traumatising for them and make
		administrating the tretment regularly a difficult task. We are a small
		company and can only sell this product in small batches so please understand
		that it may take up to 1 month for the product to arrive but we hope it to
		be with you sooner than this. Our contact details are not public but we will
		contact you by email after you have made your purchase.
	</p>

	<br />

	<img src="1.jpg" alt="Cat Inhaler with Cat" class="banner" />

	<div class="gallery">
		<img src="2.jpg" alt="Cat Inhaler side view" />
		<img src="3.jpg" alt="Cat Inhaler with diagram" />
	</div>

	<div id="price">
		<b>
			Price {"£" + PRICE / 100}
		</b>
		<small>Including delivery</small>
	</div>

	<br />
	{#if sucess}
		<p>
			Your order was proccseed successfully.<br />Within the next few days we
			will email your a confirmation receipt.<br />Thank you.
		</p>
	{:else if window.ApplePaySession}
		<apple-pay-button on:click={e => pay(e, applePay)} />
	{:else}
		<div
			id="google-pay"
			on:click={e => pay(e, googlePay)}
			style="width: min-content"
		/>
		<form on:submit={e => pay(e, card)} style="max-width: 20rem">
			<h3>Pay by Card</h3>
			<label>
				Delivery Address
				<input
					bind:this={geoRef}
					required
					placeholder
					type="search"
					on:keydown={e => e.key === "Enter" && e.preventDefault()}
				/>
			</label>
			<div id="card" />
			<label
				>Email Address
				<input
					bind:value={email}
					type="email"
					id="email"
					autocomplete="email"
					required
				/>
			</label>
			<small> We will not send you rubbish.</small>
			<button type="submit">
				{process ? "Processing ..." : "Pay Now"}
			</button>
		</form>
	{/if}
</div>

<style lang="sass" global>
	@import "styles"
</style>
