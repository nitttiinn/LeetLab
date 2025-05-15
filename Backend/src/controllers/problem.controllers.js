import {db} from '../libs/db.js'; // Import the database connection
import {UserRole} from '../generated/prisma/index.js'; // Import the UserRole enum from the generated Prisma client
import { getJudge0Languages, pollBatchResults, submitBatch } from '../libs/judge0.lib.js';

export const createProblem = async(req, res) =>{
    /*
    1. check if the user is authenticated or not
    2. if not authenticated, return 403 forbidden
    3. if auhenticated, check if the user is admin or not
    4. if not admin, return 403 forbidden
    5. if admin,get the problem data from the request body
    7. loop through each reference solution for different languages
        7a.  
    */
    // 1.
    if(!req.user){
        return res.status(403).json({ // 2.
            success: false,
            message: 'You are not authenticated'
        })
    }
    // 3.
    if(req.user.role !== "ADMIN"){
        return res.status(403).json({ // 4.
            success: false,
            message: 'You are not authorized to create a problem'
        });
    };

    // 5.
    const {title, description, difficulty, tags, examples, constraints, testcases, codeSnippets, referenceSolution} = req.body;
    try {
        // 6.
        for (const [language, solutionCode] of Object.entries(referenceSolution)) { // Object.entries() returns an array of key-value pairs or 2D array
            // get language id from the judge0 
            const languageId = await getJudge0Languages(language);

            // if languageId is not found, return 400 bad request
            if(!languageId){
                return res.status(400).json({
                    success: false,
                    message: `Language ${language} is not supported`
                })
            };
            //
            const submissions = testcases.map(({input, output})=>({
                language_id: languageId,
                source_code :solutionCode,
                std_in: input,
                expected_output: output
            }))

            const submissionResults = await submitBatch(submissions);

            const tokens = submissionResults.map((res) =>{res.token});

            const results = await pollBatchResults(tokens);

            for(let i = 0; i < results.length; i++){
                const result = results[i];

                if(result.status.id !== 3){
                    return res.status(400).json({
                        success: false,
                        message: `Test casse ${i+1} failed for language ${language}`
                    })
                }
            };

            const newProblem = await db.Problem.create({
                data:{
                    title,
                    description,
                    difficulty,
                    tags,
                    examples,
                    constraints,
                    testcases,
                    codeSnippets,
                    referenceSolution: {
                        create: {
                            language,
                            solutionCode
                        }
                    },
                    userid: req.user.id
                }
            })
            return res.status(201).json(newProblem);
        }
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
        })

    }
}