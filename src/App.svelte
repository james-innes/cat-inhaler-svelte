<script>
	import { onMount } from "svelte";
	import { payments } from "@square/web-sdk";

	let card, apple, google, sucess, process, email;
	const PRICE = 1000;

	$: onMount(async () => {
		let square = await payments("SQUARE_APP", "SQUARE_LOCATION");
		let request = square.paymentRequest({
			countryCode: "GB",
			currencyCode: "GBP",
			requestBillingContact: true,
			total: PRICE,
		});

		window.ApplePaySession && (apple = await square.applePay(request));
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
		google = await square.googlePay(request);
		await google.attach("#google-pay");
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
		Lorem Ipsum is simply dummy text of the printing and typesetting industry.
		Lorem Ipsum has been the industry's standard dummy text ever since the
		1500s, when an unknown printer took a galley of type and scrambled it to
		make a type specimen book. It has survived not only five centuries, but also
		the leap into electronic typesetting, remaining essentially unchanged. It
		was popularised in the 1960s with the release of Letraset sheets containing
		Lorem Ipsum passages, and more recently with desktop publishing software
		like Aldus PageMaker including versions of Lorem Ipsum.
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
		<blockquote>
			<p>Your order was proccseed successfully.</p>
		</blockquote>
	{:else if window.ApplePaySession}
		<apple-pay-button on:click={e => pay(e, apple)} />
	{:else}
		<div
			id="google-pay"
			on:click={e => pay(e, google)}
			style="width: min-content"
		/>
		<form on:submit={e => pay(e, card)} style="max-width: 20rem">
			<h3>Pay by Card</h3>
			<div id="card" />
			<label for="phone">Email Address</label>
			<input
				bind:value={phone}
				type="email"
				id="email"
				autocomplete="email"
				required
			/>
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
