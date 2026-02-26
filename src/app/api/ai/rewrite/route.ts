import { NextResponse } from 'next/server';

export async function POST(req: Request) {
    try {
        const { summary } = await req.json();

        if (!summary) {
            return NextResponse.json({ error: 'Summary is required' }, { status: 400 });
        }

        const apiKey = process.env.GPT_5_NANO;
        const uri = process.env.GPT_5_NANO_URI;
        const deployment = process.env.AZURE_DEPLOYMENT_5_NANO_NAME;

        if (!apiKey || !uri || !deployment) {
            console.error('Missing Azure OpenAI environment variables');
            return NextResponse.json({ error: 'AI features are not configured' }, { status: 500 });
        }

        // The URI from the environment variable already contains the full path including deployment and api-version
        // e.g. https://<resource>.openai.azure.com/openai/deployments/<deployment>/chat/completions?api-version=...
        const url = uri;

        console.log("Using Azure OpenAI URL:", url);

        const prompt = `You are an expert technical writer and professional assistant that helps developers write concise, bulleted work summaries for their timesheets.

Rewrite the following work summary to be professional, concise, and formatted as a bulleted list. 
Make sure it sounds like a well-written technical log. 
Do not include any conversational filler or introductions (like "Here is the rewritten summary:"), just output the bullet points directly.

Original summary:
${summary}`;

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'api-key': apiKey,
            },
            body: JSON.stringify({
                messages: [
                    {
                        role: 'user',
                        content: prompt
                    }
                ]
                // Note: reasoning models do not support temperature, top_p, or max_tokens.
                // If needed, 'max_completion_tokens' can be used instead of 'max_tokens' in the future.
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('Azure OpenAI error:', response.status, errorText);
            // Return the literal error text to the client so we can see it via curl
            return NextResponse.json({
                error: `Azure returned ${response.status}: ${errorText}`
            }, { status: 400 });
        }

        const data = await response.json();
        const rewrittenText = data.choices[0]?.message?.content?.trim();

        if (!rewrittenText) {
            throw new Error('Invalid response format from Azure OpenAI');
        }

        return NextResponse.json({ rewrittenText });

    } catch (error: any) {
        console.error('Error in AI rewrite:', error);
        return NextResponse.json({
            error: error.message || 'An error occurred while rewriting the summary'
        }, { status: 500 });
    }
}
