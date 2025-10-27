// This module loads and parses GLSL shader files for use in the application.
/**
 * Asynchronously loads and parses GLSL shader files.
 *
 * This function fetches the raw text of the film grain and PS1 shaders,
 * splits them into vertex and fragment shaders, and returns them as an object.
 *
 * @returns {Promise<Object>} A promise that resolves to an object containing the parsed shaders.
 * The object has `filmGrain` and `ps1` properties, each with `vertex` and `fragment` shaders.
 */
export async function loadShaders() {
    const filmGrainShaderText = await fetch('./src/core/shaders/filmGrain.glsl').then(res => res.text());
    const ps1ShaderText = await fetch('./src/core/shaders/ps1.glsl').then(res => res.text());

    const [filmGrainVertex, filmGrainFragment] = filmGrainShaderText.split('// Fragment Shader');
    const [ps1Vertex, ps1Fragment] = ps1ShaderText.split('// Fragment Shader');

    return {
        filmGrain: {
            vertex: filmGrainVertex.replace('// Vertex Shader', '').trim(),
            fragment: filmGrainFragment.trim()
        },
        ps1: {
            vertex: ps1Vertex.replace('// Vertex Shader', '').trim(),
            fragment: ps1Fragment.trim()
        }
    };
}